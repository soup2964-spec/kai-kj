import {
  CC_LEDGER_FIELD_DEFINITIONS,
  type CcLedgerFieldKey,
} from "@/lib/sheets-layout";

const KIE_CHAT_URL =
  "https://api.kie.ai/gemini-3-flash/v1/chat/completions";

const VALID_FIELD_KEYS = new Set<CcLedgerFieldKey>(
  CC_LEDGER_FIELD_DEFINITIONS.map((field) => field.key),
);

interface KieChatResponse {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
  error?: { message?: string };
}

export interface LlmLayoutMappingResult {
  columns: Partial<Record<CcLedgerFieldKey, string>>;
  confidence?: number;
  notes?: string;
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

function parseJsonFromModel(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(jsonText);
}

function buildFieldGuide(): string {
  return CC_LEDGER_FIELD_DEFINITIONS.map((field) => {
    const required = field.required ? " (required)" : "";
    return `- ${field.key}${required}: ${field.label}. Aliases: ${field.headerAliases.join(", ")}`;
  }).join("\n");
}

function formatHeadersForPrompt(headers: string[]): string {
  return headers
    .map((header, index) => {
      const letter = columnIndexToLetter(index);
      return `${letter}: ${header || "(empty)"}`;
    })
    .join("\n");
}

function columnIndexToLetter(index: number): string {
  let value = index + 1;
  let result = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }
  return result;
}

function normalizeLlmColumns(
  raw: unknown,
  headerCount: number,
): Partial<Record<CcLedgerFieldKey, string>> {
  if (!raw || typeof raw !== "object") return {};

  const source = raw as Record<string, unknown>;
  const columnsRaw =
    source.columns && typeof source.columns === "object"
      ? (source.columns as Record<string, unknown>)
      : source;

  const columns: Partial<Record<CcLedgerFieldKey, string>> = {};

  for (const [key, value] of Object.entries(columnsRaw)) {
    if (!VALID_FIELD_KEYS.has(key as CcLedgerFieldKey)) continue;
    if (typeof value !== "string" || !value.trim()) continue;

    const letter = value.trim().toUpperCase();
    if (!/^[A-Z]+$/.test(letter)) continue;

    const index = letterToColumnIndex(letter);
    if (index == null || index < 0 || index >= headerCount) continue;

    columns[key as CcLedgerFieldKey] = letter;
  }

  return columns;
}

function letterToColumnIndex(column: string): number | null {
  const normalized = column.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(normalized)) return null;

  let index = 0;
  for (let i = 0; i < normalized.length; i++) {
    index = index * 26 + (normalized.charCodeAt(i) - 64);
  }

  return index - 1;
}

function formatSampleRows(sampleRows: string[][]): string {
  if (sampleRows.length === 0) return "(no sample rows provided)";

  return sampleRows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, index) => `${columnIndexToLetter(index)}=${value || ""}`)
        .join(" | ");
      return `Row ${rowIndex + 1}: ${cells}`;
    })
    .join("\n");
}

/** Use Gemini to infer which spreadsheet columns match Moodna receipt fields. */
export async function suggestLayoutWithLlm(options: {
  headers: string[];
  sampleRows?: string[][];
  tabName?: string;
}): Promise<LlmLayoutMappingResult | null> {
  const apiKey = process.env.KIE_API_KEY?.trim();
  if (!apiKey || options.headers.length === 0) return null;

  const systemPrompt = `You map credit-card ledger spreadsheet columns to Moodna receipt fields.

Return ONLY valid JSON:
{
  "columns": {
    "date": "A",
    "merchant": "B",
    "amount": "C",
    "category": "D",
    "billableStatus": "E",
    "billableReason": "F",
    "workOrder": "G",
    "card": "H",
    "sheetStatus": "I",
    "reconciled": "J",
    "expenseId": "K"
  },
  "confidence": 0.92,
  "notes": "brief explanation"
}

Moodna fields:
${buildFieldGuide()}

Rules:
- Map ONLY columns that clearly exist in the user's sheet headers
- Use Excel column letters (A, B, C, …) that match the header list provided
- expenseId and sheetStatus are required when a reasonable column exists
- sheetStatus holds ORANGE/GREEN workflow values
- expenseId holds a unique receipt id column when present; otherwise skip
- Do not invent columns — omit fields you cannot confidently map
- Prefer the user's exact header meaning over generic guesses
- Respond with JSON only, no markdown fences`;

  const userPrompt = `Spreadsheet tab: ${options.tabName ?? "unknown"}

Header row:
${formatHeadersForPrompt(options.headers)}

Sample data rows:
${formatSampleRows(options.sampleRows ?? [])}

Map each Moodna field to the best matching column letter.`;

  try {
    const response = await fetch(KIE_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        reasoning_effort: "medium",
      }),
    });

    const data = (await response.json()) as KieChatResponse;
    if (!response.ok) {
      throw new Error(data.error?.message ?? `Kie API error (${response.status})`);
    }

    const rawContent = extractTextContent(data.choices?.[0]?.message?.content);
    if (!rawContent) return null;

    const parsed = parseJsonFromModel(rawContent) as {
      columns?: unknown;
      confidence?: number;
      notes?: string;
    };

    const columns = normalizeLlmColumns(parsed, options.headers.length);
    if (Object.keys(columns).length === 0) return null;

    return {
      columns,
      confidence:
        typeof parsed.confidence === "number" ? parsed.confidence : undefined,
      notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
    };
  } catch {
    return null;
  }
}
