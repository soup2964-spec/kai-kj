import { EXPENSE_CATEGORIES, type ExtractedReceipt } from "@/lib/types";
import { normalizeCardLastFour } from "@/lib/card-last-four";
import { normalizeLineItems } from "@/lib/receipt-line-items";

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
    { "name": "Sandwich", "amount": 8.99 }
  ],
  "confidence": 0.95,
  "cardLastFour": "1234"
}

Rules:
- amount must be the final total paid (after tax), as a number
- date should be the receipt date; use today's date if unclear
- category must be exactly one of the allowed values
- confidence is 0-1 based on image clarity and extraction certainty
- lineItems must list purchased items visible on the receipt with name and price when shown
- each lineItems[].amount must be a number (use null only if price is not visible on the receipt)
- cardLastFour: the last 4 digits of the credit or debit card used for payment, if shown on the receipt (e.g. ****1234, x1234, ending in 1234). Use null if no card digits are visible
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

function parseJsonFromModel(text: string): ExtractedReceipt {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText) as ExtractedReceipt;
}

function validateReceipt(parsed: ExtractedReceipt): ExtractedReceipt {
  if (
    !parsed.merchant ||
    typeof parsed.amount !== "number" ||
    !EXPENSE_CATEGORIES.includes(parsed.category)
  ) {
    throw new Error("Invalid receipt data returned");
  }

  return {
    ...parsed,
    lineItems: normalizeLineItems(parsed.lineItems),
    cardLastFour: normalizeCardLastFour(parsed.cardLastFour),
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
              text: "Extract and categorize this receipt.",
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
