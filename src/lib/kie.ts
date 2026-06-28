import { EXPENSE_CATEGORIES, type ExtractedReceipt } from "@/lib/types";
import {
  normalizeCardLastFour,
  resolveCardBrand,
  resolveCardLastFour,
} from "@/lib/card-last-four";
import { normalizeLineItems } from "@/lib/receipt-line-items";
import { resolveWorkOrderNumber } from "@/lib/work-order";

const KIE_CHAT_URL =
  "https://api.kie.ai/gemini-3-flash/v1/chat/completions";

const SYSTEM_PROMPT = `You extract expense data from receipt photos and categorize the purchase.

Return ONLY valid JSON with this shape:
{
  "merchant": "store or vendor name",
  "amount": 42.99,
  "date": "YYYY-MM-DD",
  "category": "one of: ${EXPENSE_CATEGORIES.join(", ")}",
  "categoryReason": "brief explanation for the category",
  "lineItems": [
    { "name": "Coffee", "amount": 4.50 },
    { "name": "VISA CREDIT ****1234", "amount": null }
  ],
  "confidence": 0.95,
  "cardLastFour": "1234",
  "cardBrand": "visa",
  "paymentDetails": "VISA CREDIT ************1234",
  "workOrderNumber": "76-2234"
}

Rules:
- amount must be the final total paid (after tax), as a number
- date should be the receipt date; use today's date if unclear
- category must be exactly one of the allowed values
- confidence is 0-1 based on image clarity and extraction certainty
- lineItems must list purchased items visible on the receipt with name and price when shown
- each lineItems[].amount must be a number (use null only if price is not visible on the receipt)
- PAYMENT SECTION (critical): read the card type and masked card number near the bottom of the receipt
- cardLastFour: exactly 4 digits for the card used to pay. Look for ****1234, XXXX1234, x1234, ending in 1234, or Visa/Mastercard/Amex/Discover followed by masked digits. Use null only if no card digits appear anywhere on the receipt
- cardBrand: one of visa, mastercard, amex, discover, other — from the payment line (e.g. VISA, MC, AMEX). Use null if no card network is shown
- paymentDetails: copy the full payment/tender line exactly as printed on the receipt (e.g. "VISA CREDIT ************1234", "MASTERCARD  ****5678", "CHIP READ"). Use null if no card payment line exists
- when card payment is shown, always add that payment line as a lineItems entry with amount null
- WORK ORDER (AppFolio): property maintenance receipts often have a handwritten or printed work order number in format xx-xxxx (e.g. 76-2234). Look anywhere on the receipt — margins, top, bottom, near totals. Labels include WO, W/O, Work Order
- workOrderNumber: the AppFolio work order exactly as xx-xxxx (e.g. 76-2234). Use null if no work order number is visible on the receipt
- when a work order is visible, add it as a lineItems entry with amount null (e.g. name: "WO 76-2234")
- use category "months" for recurring monthly charges (rent, lease payments, subscriptions, membership fees, monthly insurance premiums)
- use category "credit_cards" for credit card payments, card statements, finance charges, or purchases where the merchant is a bank/card issuer (Visa, Mastercard, Amex, Chase, Capital One, etc.)
- respond with JSON only, no markdown fences or extra text`;

interface KieChatResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  error?: { message?: string };
}

type KieReceiptPayload = ExtractedReceipt & {
  paymentDetails?: string | null;
};

function extractTextContent(content: unknown): string {
  if (!content) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        part &&
        typeof part === "object" &&
        "type" in part &&
        part.type === "text" &&
        "text" in part &&
        typeof part.text === "string"
          ? part.text
          : "",
      )
      .join("");
  }
  return "";
}

function parseJsonFromModel(text: string): KieReceiptPayload {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText) as KieReceiptPayload;
}

function collectReceiptText(parsed: KieReceiptPayload): string {
  return [
    parsed.paymentDetails,
    parsed.lineItems.map((item) => item.name).join("\n"),
    parsed.categoryReason,
    parsed.merchant,
  ]
    .filter((value): value is string => Boolean(value))
    .join("\n");
}

function validateReceipt(parsed: KieReceiptPayload): ExtractedReceipt {
  if (
    !parsed.merchant ||
    typeof parsed.amount !== "number" ||
    !EXPENSE_CATEGORIES.includes(parsed.category)
  ) {
    throw new Error("Invalid receipt data returned");
  }

  const receiptText = collectReceiptText(parsed);

  return {
    merchant: parsed.merchant,
    amount: parsed.amount,
    date: parsed.date,
    category: parsed.category,
    categoryReason: parsed.categoryReason,
    lineItems: normalizeLineItems(parsed.lineItems),
    confidence: parsed.confidence,
    cardLastFour: resolveCardLastFour(parsed.cardLastFour, receiptText),
    cardBrand: resolveCardBrand(parsed.cardBrand, receiptText),
    workOrderNumber: resolveWorkOrderNumber(
      parsed.workOrderNumber,
      receiptText,
    ),
  };
}

export async function scanReceiptWithKie(
  apiKey: string,
  imageBase64: string,
  mimeType: string,
): Promise<ExtractedReceipt> {
  const response = await fetch(KIE_CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract and categorize this receipt. Read the payment section for card details. For property maintenance purchases, look for an AppFolio work order number (format xx-xxxx, e.g. 76-2234) written as WO or Work Order on the receipt.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      stream: false,
      reasoning_effort: "high",
    }),
  });

  const data = (await response.json()) as KieChatResponse;

  if (!response.ok) {
    throw new Error(data.error?.message ?? `Kie API error (${response.status})`);
  }

  const rawContent = extractTextContent(data.choices?.[0]?.message?.content);
  if (!rawContent) {
    throw new Error("Empty response from Gemini");
  }

  return validateReceipt(parseJsonFromModel(rawContent));
}
