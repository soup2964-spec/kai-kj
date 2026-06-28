"use client";

import { useState } from "react";
import {
  getAccountEmail,
  isValidAccountEmail,
  setAccountEmail,
} from "@/lib/account-id";

type AccountEmailCardProps = {
  onAccountSaved?: () => void;
};

export function AccountEmailCard({ onAccountSaved }: AccountEmailCardProps) {
  const [email, setEmail] = useState(() => getAccountEmail() ?? "");
  const [savedEmail, setSavedEmail] = useState<string | null>(() =>
    getAccountEmail(),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidAccountEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setSaving(true);
    try {
      const normalized = setAccountEmail(email);
      setSavedEmail(normalized);
      onAccountSaved?.();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save account email.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="qb-card">
      <div className="qb-card-body">
        <p className="text-sm font-semibold text-qb-text">Your account</p>
        <p className="mt-1 text-xs text-qb-text-secondary">
          Expenses are saved to your account email so they stay available across
          devices.
        </p>

        <form
          onSubmit={(event) => {
            void handleSave(event);
          }}
          className="mt-3 flex flex-col gap-2 sm:flex-row"
        >
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm text-qb-text"
          />
          <button
            type="submit"
            disabled={saving}
            className="qb-btn-primary qb-btn-compact shrink-0"
          >
            {saving ? "Saving..." : savedEmail ? "Update" : "Save account"}
          </button>
        </form>

        {savedEmail ? (
          <p className="mt-2 text-xs text-qb-text-secondary">
            Signed in as <span className="font-semibold text-qb-text">{savedEmail}</span>
          </p>
        ) : null}

        {error ? <p className="mt-2 text-xs text-qb-danger">{error}</p> : null}
      </div>
    </section>
  );
}
