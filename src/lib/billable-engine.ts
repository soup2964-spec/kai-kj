import billableRulesConfig from "@/config/billable-rules.json";
import type {
  BillableSource,
  BillableStatus,
  ExtractedReceipt,
  ExpenseCategory,
  ScannedReceipt,
} from "@/lib/types";

type RuleType =
  | "merchant_blocklist"
  | "merchant_allowlist"
  | "category"
  | "amount_over"
  | "line_item_keyword";

interface BillableRule {
  id: string;
  type: RuleType;
  patterns?: string[];
  categories?: ExpenseCategory[];
  category?: ExpenseCategory;
  maxAmount?: number;
  keywords?: string[];
  billableStatus: BillableStatus;
  reason: string;
}

interface BillableRulesConfig {
  rules: BillableRule[];
  default: {
    billableStatus: BillableStatus;
    reason: string;
  };
}

export interface BillableEvaluation {
  billableStatus: BillableStatus;
  billableReason: string;
  billableSource: BillableSource;
  matchedRuleId?: string;
}

const config = billableRulesConfig as BillableRulesConfig;

function normalizeText(value: string): string {
  return value.toLowerCase().trim();
}

function merchantMatches(merchant: string, patterns: string[]): boolean {
  const normalizedMerchant = normalizeText(merchant);
  return patterns.some((pattern) =>
    normalizedMerchant.includes(normalizeText(pattern)),
  );
}

function lineItemsText(receipt: ExtractedReceipt): string {
  return receipt.lineItems.map((item) => normalizeText(item.name)).join(" ");
}

function evaluateRule(
  rule: BillableRule,
  receipt: ExtractedReceipt,
): boolean {
  switch (rule.type) {
    case "merchant_blocklist":
    case "merchant_allowlist":
      return merchantMatches(receipt.merchant, rule.patterns ?? []);
    case "category":
      return (rule.categories ?? []).includes(receipt.category);
    case "amount_over":
      return (
        receipt.category === rule.category &&
        typeof rule.maxAmount === "number" &&
        receipt.amount > rule.maxAmount
      );
    case "line_item_keyword": {
      const haystack = `${normalizeText(receipt.merchant)} ${lineItemsText(receipt)}`;
      return (rule.keywords ?? []).some((keyword) =>
        haystack.includes(normalizeText(keyword)),
      );
    }
    default:
      return false;
  }
}

const RULE_ORDER: RuleType[] = [
  "merchant_blocklist",
  "merchant_allowlist",
  "amount_over",
  "line_item_keyword",
  "category",
];

export function evaluateBillable(
  receipt: ExtractedReceipt,
  rules: BillableRulesConfig = config,
): BillableEvaluation {
  for (const type of RULE_ORDER) {
    const matchingRule = rules.rules.find(
      (rule) => rule.type === type && evaluateRule(rule, receipt),
    );

    if (matchingRule) {
      return {
        billableStatus: matchingRule.billableStatus,
        billableReason: matchingRule.reason,
        billableSource: "rule",
        matchedRuleId: matchingRule.id,
      };
    }
  }

  return {
    billableStatus: rules.default.billableStatus,
    billableReason: rules.default.reason,
    billableSource: "default",
  };
}

export function applyBillableEvaluation(
  receipt: ExtractedReceipt,
  evaluation: BillableEvaluation,
): ScannedReceipt {
  return {
    ...receipt,
    ...evaluation,
  };
}

export function evaluateAndApplyBillable(
  receipt: ExtractedReceipt,
): ScannedReceipt {
  return applyBillableEvaluation(receipt, evaluateBillable(receipt));
}

export function normalizeBillableFields(
  expense: Partial<ScannedReceipt>,
): Pick<
  ScannedReceipt,
  "billableStatus" | "billableReason" | "billableSource" | "matchedRuleId"
> {
  if (
    expense.billableStatus &&
    expense.billableReason &&
    expense.billableSource
  ) {
    return {
      billableStatus: expense.billableStatus,
      billableReason: expense.billableReason,
      billableSource: expense.billableSource,
      matchedRuleId: expense.matchedRuleId,
    };
  }

  return {
    billableStatus: "review",
    billableReason: "Legacy receipt — re-scan or review manually",
    billableSource: "default",
  };
}
