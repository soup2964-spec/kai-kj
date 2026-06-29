"use client";

import { useState } from "react";
import { IconSupport } from "@/components/icons";
import { useSupportComplaints } from "@/lib/support-complaints-store";

function formatComplaintDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SupportPage() {
  const { complaints, loaded, submitting, error, submitComplaint } =
    useSupportComplaints();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const result = await submitComplaint({ subject, message });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }

    setSubject("");
    setMessage("");
    setSuccessMessage("Your complaint was submitted. Our team will review it soon.");
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="qb-spinner" />
      </div>
    );
  }

  return (
    <>
      <section className="qb-card">
        <div className="qb-card-header">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-qb-blue-light text-qb-blue">
              <IconSupport className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-qb-text">Submit a complaint</h2>
              <p className="mt-1 text-sm text-qb-text-secondary">
                Tell us what went wrong. Complaints appear in your inbox below so you
                can track what you&apos;ve sent.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="qb-card-body space-y-4">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
              Subject
            </span>
            <input
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Brief summary of the issue"
              maxLength={200}
              className="mt-1.5 w-full rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm text-qb-text"
            />
          </label>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-qb-text-muted">
              Complaint details
            </span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe the problem, what you expected, and any steps to reproduce it..."
              rows={6}
              maxLength={5000}
              className="mt-1.5 w-full resize-y rounded border border-qb-border bg-qb-surface px-3 py-2 text-sm text-qb-text"
            />
          </label>

          {formError ? (
            <p className="text-sm text-qb-danger">{formError}</p>
          ) : null}
          {successMessage ? (
            <p className="text-sm font-medium text-emerald-700">{successMessage}</p>
          ) : null}
          {error ? (
            <p className="text-sm text-qb-text-secondary">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="qb-btn-primary text-sm"
          >
            {submitting ? "Submitting..." : "Submit complaint"}
          </button>
        </form>
      </section>

      <section className="qb-card">
        <div className="qb-card-header flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-qb-text">Support inbox</h2>
            <p className="mt-1 text-sm text-qb-text-secondary">
              {complaints.length === 0
                ? "No complaints yet. Submissions will show up here."
                : `${complaints.length} complaint${complaints.length === 1 ? "" : "s"} submitted`}
            </p>
          </div>
        </div>

        <div className="qb-card-body">
          {complaints.length === 0 ? (
            <div className="rounded-lg border border-dashed border-qb-border bg-qb-bg px-4 py-8 text-center">
              <p className="text-sm font-semibold text-qb-text-secondary">
                Your inbox is empty
              </p>
              <p className="mt-1 text-xs text-qb-text-muted">
                Use the form above to send your first customer complaint.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {complaints.map((complaint) => {
                const expanded = expandedId === complaint.id;

                return (
                  <li
                    key={complaint.id}
                    className="rounded-lg border border-qb-border bg-qb-surface"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedId(expanded ? null : complaint.id)
                      }
                      className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-qb-text">
                          {complaint.subject}
                        </span>
                        <span className="mt-1 block text-xs text-qb-text-muted">
                          {formatComplaintDate(complaint.createdAt)}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            complaint.status === "resolved"
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                              : "border border-amber-200 bg-amber-50 text-amber-800"
                          }`}
                        >
                          {complaint.status === "resolved" ? "Resolved" : "Open"}
                        </span>
                        <span className="text-xs text-qb-text-muted">
                          {expanded ? "▲" : "▼"}
                        </span>
                      </span>
                    </button>

                    {expanded ? (
                      <div className="border-t border-qb-border-light px-4 py-3">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-qb-text-secondary">
                          {complaint.message}
                        </p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
