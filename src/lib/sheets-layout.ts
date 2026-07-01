import type { CcLedgerRowInput, CcLedgerSheetStatus } from "@/lib/cc-ledger-types";
import { formatCardLabel } from "@/lib/card-last-four";
import { formatWorkOrderLabel } from "@/lib/work-order";
import { CATEGORY_META } from "@/lib/categories";

/** Moodna fields that can be mapped to user spreadsheet columns. */
export type CcLedgerFieldKey =
  | "date"
  | "merchant"
  | "amount"
  | "category"
  | "billableStatus"
  | "billableReason"
  | "workOrder"
  | "card"
  | "sheetStatus"
  | "reconciled"
  | "expenseId";

export interface SheetsLayoutConfig {
  /** Tab name template. Supports `{cardLastFour}` and `{card}`. */
  tabPattern: string;
  /** When set, all reads/writes use this tab instead of tabPattern. */
  fixedTab?: string;
  headerRow: number;
  dataStartRow: number;
  /** When false, tabs must already exist in the user's workbook. */
  createMissingTabs: boolean;
  columns: Partial<Record<CcLedgerFieldKey, string>>;
}

export interface CcLedgerFieldDefinition {
  key: CcLedgerFieldKey;
  label: string;
  required: boolean;
  headerAliases: string[];
}

export const CC_LEDGER_FIELD_DEFINITIONS: CcLedgerFieldDefinition[] = [
  {
    key: "date",
    label: "Date",
    required: false,
    headerAliases: ["date", "txn date", "transaction date", "purchase date"],
  },
  {
    key: "merchant",
    label: "Merchant / Vendor",
    required: false,
    headerAliases: ["merchant", "vendor", "payee", "description"],
  },
  {
    key: "amount",
    label: "Amount",
    required: false,
    headerAliases: ["amount", "total", "charge"],
  },
  {
    key: "category",
    label: "Category",
    required: false,
    headerAliases: ["category", "expense category", "type"],
  },
  {
    key: "billableStatus",
    label: "Billable status",
    required: false,
    headerAliases: ["billable status", "billable", "billing status"],
  },
  {
    key: "billableReason",
    label: "Billable reason",
    required: false,
    headerAliases: ["billable reason", "reason", "billing reason"],
  },
  {
    key: "workOrder",
    label: "Work order",
    required: false,
    headerAliases: ["work order", "wo", "wo#", "work order #"],
  },
  {
    key: "card",
    label: "Card",
    required: false,
    headerAliases: ["card", "credit card", "card last four", "last 4"],
  },
  {
    key: "sheetStatus",
    label: "Sheet status (ORANGE/GREEN)",
    required: true,
    headerAliases: ["sheet status", "status", "agent status", "color status"],
  },
  {
    key: "reconciled",
    label: "Reconciled",
    required: false,
    headerAliases: ["reconciled", "cc reconciled", "matched"],
  },
  {
    key: "expenseId",
    label: "Expense ID",
    required: true,
    headerAliases: ["expense id", "receipt id", "kai id", "id"],
  },
];

export const DEFAULT_SHEETS_LAYOUT: SheetsLayoutConfig = {
  tabPattern: "CC-{cardLastFour}",
  headerRow: 1,
  dataStartRow: 2,
  createMissingTabs: true,
  columns: {
    date: "A",
    merchant: "B",
    amount: "C",
    category: "D",
    billableStatus: "E",
    billableReason: "F",
    workOrder: "G",
    card: "H",
    sheetStatus: "I",
    reconciled: "J",
    expenseId: "K",
  },
};

export const COLUMN_LETTER_OPTIONS = buildColumnLetterOptions(52);

function buildColumnLetterOptions(count: number): string[] {
  const letters: string[] = [];
  for (let index = 0; index < count; index++) {
    letters.push(indexToColumnLetter(index));
  }
  return letters;
}

export function indexToColumnLetter(index: number): string {
  let value = index + 1;
  let result = "";

  while (value > 0) {
    const remainder = (value - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    value = Math.floor((value - 1) / 26);
  }

  return result;
}

export function columnLetterToIndex(column: string): number | null {
  const normalized = column.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(normalized)) return null;

  let index = 0;
  for (let i = 0; i < normalized.length; i++) {
    index = index * 26 + (normalized.charCodeAt(i) - 64);
  }

  return index - 1;
}

export function normalizeColumnLetter(column: string): string | null {
  const index = columnLetterToIndex(column);
  if (index == null || index < 0) return null;
  return indexToColumnLetter(index);
}

export function resolveTabNameFromPattern(
  pattern: string,
  cardLastFour: string | null | undefined,
): string {
  const lastFour =
    cardLastFour && cardLastFour.length === 4 ? cardLastFour : "Unknown";

  return pattern
    .replace(/\{cardLastFour\}/gi, lastFour)
    .replace(/\{card\}/gi, lastFour)
    .trim();
}

export function mergeSheetsLayoutConfig(
  partial: Partial<SheetsLayoutConfig> | null | undefined,
): SheetsLayoutConfig {
  if (!partial) {
    return {
      ...DEFAULT_SHEETS_LAYOUT,
      columns: { ...DEFAULT_SHEETS_LAYOUT.columns },
    };
  }

  return {
    tabPattern: partial.tabPattern?.trim() || DEFAULT_SHEETS_LAYOUT.tabPattern,
    fixedTab: partial.fixedTab?.trim() || undefined,
    headerRow: partial.headerRow ?? DEFAULT_SHEETS_LAYOUT.headerRow,
    dataStartRow: partial.dataStartRow ?? DEFAULT_SHEETS_LAYOUT.dataStartRow,
    createMissingTabs:
      partial.createMissingTabs ?? DEFAULT_SHEETS_LAYOUT.createMissingTabs,
    columns: {
      ...DEFAULT_SHEETS_LAYOUT.columns,
      ...normalizeColumnMap(partial.columns),
    },
  };
}

export function resolveLedgerTab(
  layout: SheetsLayoutConfig,
  cardLastFour?: string | null,
): string {
  if (layout.fixedTab?.trim()) {
    return layout.fixedTab.trim();
  }

  return resolveTabNameFromPattern(layout.tabPattern, cardLastFour);
}

function normalizeColumnMap(
  columns: Partial<Record<CcLedgerFieldKey, string>> | undefined,
): Partial<Record<CcLedgerFieldKey, string>> {
  if (!columns) return {};

  const normalized: Partial<Record<CcLedgerFieldKey, string>> = {};
  for (const [key, value] of Object.entries(columns) as Array<
    [CcLedgerFieldKey, string | undefined]
  >) {
    if (!value?.trim()) continue;
    const letter = normalizeColumnLetter(value);
    if (letter) normalized[key] = letter;
  }
  return normalized;
}

export function parseSheetsLayoutConfig(value: unknown): SheetsLayoutConfig {
  if (!value || typeof value !== "object") {
    return mergeSheetsLayoutConfig(null);
  }

  const raw = value as Partial<SheetsLayoutConfig>;
  return mergeSheetsLayoutConfig(raw);
}

export function validateSheetsLayoutConfig(
  layout: SheetsLayoutConfig,
): string[] {
  const errors: string[] = [];

  if (!layout.tabPattern.trim()) {
    errors.push("Tab name pattern is required.");
  }

  if (layout.headerRow < 1) {
    errors.push("Header row must be at least 1.");
  }

  if (layout.dataStartRow < 1) {
    errors.push("Data start row must be at least 1.");
  }

  if (layout.dataStartRow <= layout.headerRow) {
    errors.push("Data start row must be below the header row.");
  }

  for (const field of CC_LEDGER_FIELD_DEFINITIONS) {
    if (!field.required) continue;
    const column = layout.columns[field.key];
    if (!column) {
      errors.push(`${field.label} column is required.`);
      continue;
    }
    if (!normalizeColumnLetter(column)) {
      errors.push(`${field.label} column "${column}" is not valid.`);
    }
  }

  return errors;
}

function formatBillableStatus(status: string): string {
  switch (status) {
    case "billable":
      return "Billable";
    case "non_billable":
      return "Non-billable";
    case "review":
      return "Needs review";
    default:
      return status;
  }
}

export function ccLedgerFieldValue(
  field: CcLedgerFieldKey,
  row: CcLedgerRowInput,
): string {
  switch (field) {
    case "date":
      return row.date;
    case "merchant":
      return row.merchant;
    case "amount":
      return row.amount.toFixed(2);
    case "category":
      return (
        CATEGORY_META[row.category as keyof typeof CATEGORY_META]?.label ??
        row.category
      );
    case "billableStatus":
      return formatBillableStatus(row.billableStatus);
    case "billableReason":
      return row.billableReason ?? "";
    case "workOrder":
      return formatWorkOrderLabel(row.workOrderNumber);
    case "card":
      return formatCardLabel(row.cardLastFour);
    case "sheetStatus":
      return row.sheetStatus ?? "";
    case "reconciled":
      return row.reconciled ? "Yes" : "No";
    case "expenseId":
      return row.expenseId;
    default:
      return "";
  }
}

export function buildMappedCellUpdates(
  layout: SheetsLayoutConfig,
  tab: string,
  rowNumber: number,
  row: CcLedgerRowInput,
  fields?: CcLedgerFieldKey[],
): Array<{ range: string; values: string[][] }> {
  const selectedFields =
    fields ?? CC_LEDGER_FIELD_DEFINITIONS.map((definition) => definition.key);
  const updates: Array<{ range: string; values: string[][] }> = [];

  for (const field of selectedFields) {
    const column = layout.columns[field];
    if (!column) continue;

    updates.push({
      range: `'${tab}'!${column}${rowNumber}`,
      values: [[ccLedgerFieldValue(field, row)]],
    });
  }

  return updates;
}

export function suggestLayoutFromHeaders(
  headers: string[],
): Partial<Record<CcLedgerFieldKey, string>> {
  const suggestions: Partial<Record<CcLedgerFieldKey, string>> = {};

  headers.forEach((header, index) => {
    const normalized = header.trim().toLowerCase();
    if (!normalized) return;

    for (const field of CC_LEDGER_FIELD_DEFINITIONS) {
      if (suggestions[field.key]) continue;

      const matches = field.headerAliases.some(
        (alias) => normalized === alias || normalized.includes(alias),
      );

      if (matches) {
        suggestions[field.key] = indexToColumnLetter(index);
      }
    }
  });

  return suggestions;
}

export type LayoutMappingSource = "llm" | "rules" | "hybrid";

export interface SheetLayoutSuggestion {
  columns: Partial<Record<CcLedgerFieldKey, string>>;
  mappingSource: LayoutMappingSource;
  llmConfidence?: number;
  llmNotes?: string;
}

/** Prefer LLM mapping, then fill gaps with header alias rules. */
export async function suggestLayoutFromSheetContext(options: {
  headers: string[];
  sampleRows?: string[][];
  tabName?: string;
}): Promise<SheetLayoutSuggestion> {
  const ruleColumns = suggestLayoutFromHeaders(options.headers);
  const { suggestLayoutWithLlm } = await import("@/lib/sheets-layout-llm");
  const llmResult = await suggestLayoutWithLlm(options);

  if (!llmResult) {
    return {
      columns: ruleColumns,
      mappingSource: "rules",
    };
  }

  const merged = { ...ruleColumns, ...llmResult.columns };
  const mappingSource: LayoutMappingSource =
    Object.keys(llmResult.columns).length > 0 &&
    Object.keys(ruleColumns).length > 0
      ? "hybrid"
      : "llm";

  return {
    columns: merged,
    mappingSource,
    llmConfidence: llmResult.confidence,
    llmNotes: llmResult.notes,
  };
}

export function buildStatusCellUpdates(
  layout: SheetsLayoutConfig,
  tab: string,
  rowNumber: number,
  update: {
    sheetStatus?: CcLedgerSheetStatus;
    reconciled?: boolean;
  },
): Array<{ range: string; values: string[][] }> {
  const updates: Array<{ range: string; values: string[][] }> = [];

  if (update.sheetStatus !== undefined && layout.columns.sheetStatus) {
    updates.push({
      range: `'${tab}'!${layout.columns.sheetStatus}${rowNumber}`,
      values: [[update.sheetStatus]],
    });
  }

  if (update.reconciled !== undefined && layout.columns.reconciled) {
    updates.push({
      range: `'${tab}'!${layout.columns.reconciled}${rowNumber}`,
      values: [[update.reconciled ? "Yes" : "No"]],
    });
  }

  return updates;
}

export function expenseIdColumn(layout: SheetsLayoutConfig): string {
  const column = layout.columns.expenseId;
  if (!column) {
    throw new Error("Expense ID column is not mapped.");
  }
  return column;
}
