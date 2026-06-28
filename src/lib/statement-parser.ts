import { normalizeCardLastFour } from "@/lib/card-last-four";
import type { ParsedStatement, StatementSourceType } from "@/lib/statement-types";
import { extractTextFromPdfBuffer } from "@/lib/statement-pdf-text";

const DATE_PATTERNS = [
  /^(\d{1,2}\/\d{1,2}\/\d{2,4})/,
  /^(\d{4}-\d{2}-\d{2})/,
  /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
];

const AMOUNT_AT_END = /(-?\$?\s?\d{1,3}(?:,\d{3})*\.\d{2})\s*$/;
const CARD_HINT =
  /(?:account|card).{0,30}(?:ending|xxxx|\*{4})\s*(\d{4})/i;

function normalizeDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!slash) return null;

  const month = slash[1].padStart(2, "0");
  const day = slash[2].padStart(2, "0");
  let year = slash[3];
  if (year.length === 2) {
    year = Number(year) > 50 ? `19${year}` : `20${year}`;
  }

  return `${year}-${month}-${day}`;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[$,\s]/g, "");
  const value = Number(cleaned);
  return Number.isFinite(value) ? value : null;
}

function detectCardLastFour(text: string): string | null {
  const match = text.match(CARD_HINT);
  if (match?.[1]) return normalizeCardLastFour(match[1]);
  return null;
}

function detectStatementPeriod(dates: string[]): string | null {
  if (dates.length === 0) return null;
  const sorted = [...dates].sort();
  const latest = sorted[sorted.length - 1];
  return latest.length >= 7 ? latest.slice(0, 7) : null;
}

function parseLineToTransaction(line: string): {
  txnDate: string;
  merchant: string;
  amount: number;
  description: string;
} | null {
  const trimmed = line.trim();
  if (trimmed.length < 8) return null;

  let dateRaw: string | null = null;
  for (const pattern of DATE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      dateRaw = normalizeDate(match[1]);
      if (dateRaw) break;
    }
  }
  if (!dateRaw) return null;

  const amountMatch = trimmed.match(AMOUNT_AT_END);
  if (!amountMatch?.[1]) return null;

  const amount = parseAmount(amountMatch[1]);
  if (amount == null || amount === 0) return null;

  const middle = trimmed
    .replace(DATE_PATTERNS[0], "")
    .replace(DATE_PATTERNS[1], "")
    .replace(AMOUNT_AT_END, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!middle || middle.length < 2) return null;

  const skip =
    /^(payment|thank you|balance|previous|total|credit limit|minimum)/i.test(
      middle,
    );
  if (skip) return null;

  return {
    txnDate: dateRaw,
    merchant: middle.slice(0, 120),
    amount: Math.abs(amount),
    description: middle,
  };
}

export function parseStatementText(text: string): ParsedStatement {
  const warnings: string[] = [];
  const cardLastFour = detectCardLastFour(text);
  const lines = text.split(/\r?\n/);
  const seen = new Set<string>();
  const transactions: ParsedStatement["transactions"] = [];

  for (const line of lines) {
    const txn = parseLineToTransaction(line);
    if (!txn) continue;

    const key = `${txn.txnDate}|${txn.merchant}|${txn.amount}`;
    if (seen.has(key)) continue;
    seen.add(key);

    transactions.push({
      cardLastFour,
      txnDate: txn.txnDate,
      merchant: txn.merchant,
      amount: txn.amount,
      description: txn.description,
    });
  }

  if (transactions.length === 0) {
    warnings.push(
      "No transactions detected. Try CSV export from your bank, or a clearer PDF.",
    );
  }

  return {
    cardLastFour,
    statementPeriod: detectStatementPeriod(transactions.map((t) => t.txnDate)),
    transactions,
    warnings,
  };
}

function parseCsvStatement(csv: string): ParsedStatement {
  const warnings: string[] = [];
  const rows = csv.split(/\r?\n/).filter((line) => line.trim());
  if (rows.length < 2) {
    return {
      transactions: [],
      warnings: ["CSV file is empty or has no data rows."],
    };
  }

  const header = rows[0].toLowerCase();
  const delimiter = header.includes("\t") ? "\t" : ",";

  const headers = rows[0].split(delimiter).map((h) => h.trim().toLowerCase());
  const dateIdx = headers.findIndex((h) =>
    /^(date|transaction date|posting date|trans date)$/.test(h),
  );
  const descIdx = headers.findIndex((h) =>
    /^(description|merchant|name|payee|details|memo)$/.test(h),
  );
  const amountIdx = headers.findIndex((h) =>
    /^(amount|transaction amount|debit|charge)$/.test(h),
  );

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
    return {
      transactions: [],
      warnings: [
        "Could not find Date, Description, and Amount columns. Export CSV from your bank with standard headers.",
      ],
    };
  }

  const transactions: ParsedStatement["transactions"] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i].split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ""));
    const dateRaw = cols[dateIdx];
    const merchant = cols[descIdx];
    const amountRaw = cols[amountIdx];

    const txnDate = normalizeDate(dateRaw);
    const amount = parseAmount(amountRaw);

    if (!txnDate || !merchant || amount == null) continue;
    if (amount === 0) continue;

    transactions.push({
      txnDate,
      merchant: merchant.slice(0, 120),
      amount: Math.abs(amount),
      description: merchant,
    });
  }

  if (transactions.length === 0) {
    warnings.push("No valid rows found in CSV.");
  }

  const cardLastFour = detectCardLastFour(csv.slice(0, 2000));

  return {
    cardLastFour,
    statementPeriod: detectStatementPeriod(transactions.map((t) => t.txnDate)),
    transactions,
    warnings,
  };
}

async function parseWithKie(text: string): Promise<ParsedStatement | null> {
  const apiKey = process.env.KIE_API_KEY?.trim();
  if (!apiKey || text.length < 50) return null;

  const snippet = text.slice(0, 12000);
  const response = await fetch(
    "https://api.kie.ai/gemini-3-flash/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "system",
            content:
              "Extract credit card statement transactions. Return ONLY JSON: {\"cardLastFour\":\"1234\",\"statementPeriod\":\"YYYY-MM\",\"transactions\":[{\"txnDate\":\"YYYY-MM-DD\",\"merchant\":\"...\",\"amount\":12.34,\"description\":\"...\"}]}",
          },
          {
            role: "user",
            content: `Parse transactions from this statement text:\n\n${snippet}`,
          },
        ],
        stream: false,
      }),
    },
  );

  if (!response.ok) return null;

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content ?? "";
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : raw.trim();

  try {
    const parsed = JSON.parse(jsonText) as {
      cardLastFour?: string;
      statementPeriod?: string;
      transactions?: Array<{
        txnDate?: string;
        merchant?: string;
        amount?: number;
        description?: string;
      }>;
    };

    const transactions = (parsed.transactions ?? [])
      .filter(
        (t) =>
          t.txnDate &&
          t.merchant &&
          typeof t.amount === "number" &&
          t.amount !== 0,
      )
      .map((t) => ({
        cardLastFour: normalizeCardLastFour(parsed.cardLastFour),
        txnDate: t.txnDate!,
        merchant: t.merchant!.slice(0, 120),
        amount: Math.abs(t.amount!),
        description: t.description ?? t.merchant,
      }));

    if (transactions.length === 0) return null;

    return {
      cardLastFour: normalizeCardLastFour(parsed.cardLastFour),
      statementPeriod: parsed.statementPeriod ?? null,
      transactions,
      warnings: [],
    };
  } catch {
    return null;
  }
}

export async function parseStatementFile(
  buffer: Buffer,
  filename: string,
  sourceType: StatementSourceType,
): Promise<ParsedStatement> {
  if (sourceType === "csv") {
    return parseCsvStatement(buffer.toString("utf-8"));
  }

  const text = await extractTextFromPdfBuffer(buffer);
  let parsed = parseStatementText(text);

  if (parsed.transactions.length < 3) {
    const kieParsed = await parseWithKie(text);
    if (kieParsed && kieParsed.transactions.length > parsed.transactions.length) {
      parsed = {
        ...kieParsed,
        warnings: [
          ...parsed.warnings,
          "PDF parsed with AI assist — review transactions before saving.",
        ],
      };
    }
  }

  return parsed;
}

export function detectStatementSourceType(
  filename: string,
  mimeType: string,
): StatementSourceType | null {
  if (mimeType === "text/csv" || /\.csv$/i.test(filename)) return "csv";
  if (mimeType === "application/pdf" || /\.pdf$/i.test(filename)) return "pdf";
  return null;
}
