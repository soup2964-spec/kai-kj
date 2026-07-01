"use client";

import { useState } from "react";
import { EXPENSE_CATEGORIES, type ExpenseCategory } from "@/lib/types";
import { CATEGORY_META } from "@/lib/categories";
import { useExpenseContext } from "@/lib/expense-context";
import { isGoogleSheetsSyncReady } from "@/lib/google-sheets-setup";
import { useGoogleSheetsIntegration } from "@/lib/integrations-store";

export function ManualTransactionForm() {
  const { addManualExpense } = useExpenseContext();
  const { status, loaded } = useGoogleSheetsIntegration();
  const sheetReady = loaded && isGoogleSheetsSyncReady(status);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [cardLastFour, setCardLastFour] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    const parsedAmount = Number(amount.replace(/[^0-9.-]/g, ""));
    if (!merchant.trim()) {
      setError("Enter a merchant or description.");
      setSaving(false);
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount.");
      setSaving(false);
      return;
    }

    try {
      addManualExpense({
        merchant: merchant.trim(),
        amount: parsedAmount,
        date,
        category,
        cardLastFour: cardLastFour.trim() || null,
      });
      setMerchant("");
      setAmount("");
      setCardLastFour("");
      setMessage("Transaction added and syncing to Google Sheets.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add transaction",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="qb-card overflow-hidden">
      <div className="qb-card-header">
        <h2 className="qb-section-title">Add transaction</h2>
        <p className="qb-section-desc">
          Enter a transaction manually. It saves to your account and syncs to
          your connected Google Sheet once setup is complete.
        </p>
      </div>
      <form className="qb-card-body space-y-3" onSubmit={handleSubmit}>
        {!sheetReady ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-sm text-amber-900">
            Complete Google Sheets setup on the Integrations page to sync manual
            entries to your spreadsheet.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-qb-text-muted">
              Merchant / description
            </span>
            <input
              type="text"
              value={merchant}
              onChange={(event) => setMerchant(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm text-qb-text"
              placeholder="Home Depot"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-qb-text-muted">
              Amount
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm tabular-nums text-qb-text"
              placeholder="42.50"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-qb-text-muted">
              Date
            </span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm text-qb-text"
              required
            />
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-qb-text-muted">
              Category
            </span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as ExpenseCategory)
              }
              className="mt-1.5 w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm text-qb-text"
            >
              {EXPENSE_CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {CATEGORY_META[value].label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-qb-text-muted">
              Card last 4 (optional)
            </span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              value={cardLastFour}
              onChange={(event) =>
                setCardLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="mt-1.5 w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm tabular-nums text-qb-text"
              placeholder="1234"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="qb-btn-primary w-full disabled:opacity-50 sm:w-auto"
        >
          {saving ? "Saving…" : "Add transaction"}
        </button>

        {message ? (
          <p className="text-sm text-emerald-700">{message}</p>
        ) : null}
        {error ? <p className="text-sm text-qb-danger">{error}</p> : null}
      </form>
    </section>
  );
}
