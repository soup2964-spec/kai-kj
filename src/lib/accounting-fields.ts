import type { AccountingFields, AccountingSyncStatus } from "@/lib/types";

const ACCOUNTING_STATUSES: AccountingSyncStatus[] = [
  "pending",
  "rejected",
  "synced",
  "failed",
];

export function normalizeAccountingFields(
  input: Partial<AccountingFields> | null | undefined,
): AccountingFields {
  const status = input?.accountingStatus;

  return {
    accountingStatus:
      status && ACCOUNTING_STATUSES.includes(status) ? status : "pending",
    accountingSyncedAt:
      typeof input?.accountingSyncedAt === "string"
        ? input.accountingSyncedAt
        : undefined,
    accountingReference:
      typeof input?.accountingReference === "string"
        ? input.accountingReference
        : undefined,
    accountingError:
      typeof input?.accountingError === "string"
        ? input.accountingError
        : undefined,
  };
}

export const ACCOUNTING_STATUS_META: Record<
  AccountingSyncStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending review",
    className: "border-qb-border bg-qb-bg text-qb-text-secondary",
  },
  rejected: {
    label: "Not sent",
    className: "border-qb-danger/30 bg-qb-danger-bg text-qb-danger",
  },
  synced: {
    label: "Sent to accounting",
    className: "border-qb-blue/30 bg-qb-blue-light text-qb-blue-dark",
  },
  failed: {
    label: "Sync failed",
    className: "border-qb-danger/30 bg-qb-danger-bg text-qb-danger",
  },
};

export function canReviewAccounting(status: AccountingSyncStatus) {
  return status === "pending" || status === "rejected" || status === "failed";
}
