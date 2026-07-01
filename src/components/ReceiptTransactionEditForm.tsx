"use client";

import { CATEGORY_META } from "@/lib/categories";
import {
  parseAmountInput,
  toDateInputValue,
  type ReceiptTransactionFields,
} from "@/lib/expense-update";
import { formatCardLabel } from "@/lib/card-last-four";
import { formatWorkOrderLabel } from "@/lib/work-order";
import type { BillableStatus, ExpenseCategory } from "@/lib/types";
import { EXPENSE_CATEGORIES } from "@/lib/types";

const fieldLabelClass =
  "text-[11px] font-bold uppercase tracking-wider text-qb-text-muted";
const fieldInputClass =
  "mt-1.5 w-full rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm text-qb-text";

type ReceiptTransactionEditFormProps = {
  values: ReceiptTransactionFields;
  onChange: (values: ReceiptTransactionFields) => void;
  onSave?: () => void;
  saveLabel?: string;
  showSaveButton?: boolean;
  idPrefix?: string;
};

export function ReceiptTransactionEditForm({
  values,
  onChange,
  onSave,
  saveLabel = "Save changes",
  showSaveButton = true,
  idPrefix = "receipt-edit",
}: ReceiptTransactionEditFormProps) {
  const showWorkOrderField =
    values.billableStatus === "billable" || values.billableStatus === "review";

  const patch = (partial: Partial<ReceiptTransactionFields>) => {
    onChange({ ...values, ...partial });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${idPrefix}-merchant`} className={fieldLabelClass}>
            Merchant
          </label>
          <input
            id={`${idPrefix}-merchant`}
            type="text"
            value={values.merchant}
            onChange={(event) => patch({ merchant: event.target.value })}
            className={fieldInputClass}
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-amount`} className={fieldLabelClass}>
            Amount
          </label>
          <input
            id={`${idPrefix}-amount`}
            type="text"
            inputMode="decimal"
            value={values.amount.toFixed(2)}
            onChange={(event) => {
              const amount = parseAmountInput(event.target.value);
              if (amount !== null) patch({ amount });
            }}
            className={`${fieldInputClass} tabular-nums`}
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-date`} className={fieldLabelClass}>
            Purchase date
          </label>
          <input
            id={`${idPrefix}-date`}
            type="date"
            value={toDateInputValue(values.date)}
            onChange={(event) => {
              if (event.target.value) {
                patch({ date: event.target.value });
              }
            }}
            className={fieldInputClass}
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-category`} className={fieldLabelClass}>
            Category
          </label>
          <select
            id={`${idPrefix}-category`}
            value={values.category}
            onChange={(event) =>
              patch({ category: event.target.value as ExpenseCategory })
            }
            className={fieldInputClass}
          >
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_META[category].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${idPrefix}-billable`} className={fieldLabelClass}>
            Billable status
          </label>
          <select
            id={`${idPrefix}-billable`}
            value={values.billableStatus}
            onChange={(event) =>
              patch({
                billableStatus: event.target.value as BillableStatus,
              })
            }
            className={fieldInputClass}
          >
            <option value="billable">Billable</option>
            <option value="non_billable">Non-billable</option>
            <option value="review">Needs review</option>
          </select>
        </div>

        <div>
          <label htmlFor={`${idPrefix}-vendor`} className={fieldLabelClass}>
            Vendor
          </label>
          <input
            id={`${idPrefix}-vendor`}
            type="text"
            value={values.vendorName ?? ""}
            onChange={(event) =>
              patch({
                vendorName:
                  event.target.value.trim() === "" ? null : event.target.value,
              })
            }
            className={fieldInputClass}
          />
        </div>

        <div>
          <label htmlFor={`${idPrefix}-property`} className={fieldLabelClass}>
            Property
          </label>
          <input
            id={`${idPrefix}-property`}
            type="text"
            value={values.propertyName ?? ""}
            onChange={(event) =>
              patch({
                propertyName:
                  event.target.value.trim() === "" ? null : event.target.value,
              })
            }
            className={fieldInputClass}
          />
        </div>

        {showWorkOrderField ? (
          <div>
            <label htmlFor={`${idPrefix}-wo`} className={fieldLabelClass}>
              Work order
            </label>
            <input
              id={`${idPrefix}-wo`}
              type="text"
              inputMode="numeric"
              placeholder="76-2234"
              value={values.workOrderNumber ?? ""}
              onChange={(event) => {
                const raw = event.target.value
                  .replace(/[^\d-]/g, "")
                  .slice(0, 10);
                patch({
                  workOrderNumber: raw.trim() === "" ? null : raw,
                });
              }}
              className={`${fieldInputClass} tabular-nums`}
            />
            <p className="mt-1 text-xs text-qb-text-secondary">
              {values.workOrderNumber
                ? formatWorkOrderLabel(values.workOrderNumber)
                : "Required for billable receipts"}
            </p>
          </div>
        ) : null}

        <div>
          <label htmlFor={`${idPrefix}-card`} className={fieldLabelClass}>
            Card last 4
          </label>
          <input
            id={`${idPrefix}-card`}
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="1234"
            value={values.cardLastFour ?? ""}
            onChange={(event) =>
              patch({
                cardLastFour:
                  event.target.value.replace(/\D/g, "").slice(0, 4) || null,
              })
            }
            className={`${fieldInputClass} tabular-nums`}
          />
          <p className="mt-1 text-xs text-qb-text-secondary">
            {values.cardLastFour
              ? formatCardLabel(values.cardLastFour)
              : "Optional — used for card widgets"}
          </p>
        </div>
      </div>

      {showSaveButton && onSave ? (
        <button
          type="button"
          onClick={onSave}
          className="qb-btn-primary w-full sm:w-auto"
        >
          {saveLabel}
        </button>
      ) : null}
    </div>
  );
}
