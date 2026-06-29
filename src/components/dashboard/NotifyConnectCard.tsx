"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IconCheck, IconX } from "@/components/icons";
import {
  useNotificationIntegrations,
  type SmtpConnectInput,
} from "@/lib/notify-integrations-store";
import { SMTP_PRESETS } from "@/lib/smtp-config";

type SmtpPresetKey = keyof typeof SMTP_PRESETS;

export function NotifyConnectCard({ embedded = false }: { embedded?: boolean }) {
  const searchParams = useSearchParams();
  const {
    status,
    loaded,
    error,
    saving,
    refresh,
    connectSlack,
    disconnectSlack,
    saveEmails,
    connectSmtp,
    disconnectSmtp,
    sendTestEmail,
  } = useNotificationIntegrations();

  const [preset, setPreset] = useState<SmtpPresetKey>("gmail");
  const [smtpHost, setSmtpHost] = useState<string>(SMTP_PRESETS.gmail.host);
  const [smtpPort, setSmtpPort] = useState<string>(String(SMTP_PRESETS.gmail.port));
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (status?.notifyEmailsRaw) {
      setEmailInput(status.notifyEmailsRaw);
    }
    if (status?.smtpHost) {
      setSmtpHost(status.smtpHost);
    }
    if (status?.smtpPort) {
      setSmtpPort(String(status.smtpPort));
    }
    if (status?.smtpUser) {
      setSmtpUser(status.smtpUser);
    }
    if (status?.smtpFrom) {
      setSmtpFrom(status.smtpFrom);
    }
  }, [
    status?.notifyEmailsRaw,
    status?.smtpHost,
    status?.smtpPort,
    status?.smtpUser,
    status?.smtpFrom,
  ]);

  useEffect(() => {
    const slackStatus = searchParams.get("slack");
    if (slackStatus === "connected") {
      void refresh();
    }
    if (slackStatus === "error") {
      setLocalError(
        searchParams.get("message") ?? "Could not connect Slack.",
      );
    }
  }, [searchParams, refresh]);

  function applyPreset(key: SmtpPresetKey) {
    setPreset(key);
    setSmtpHost(SMTP_PRESETS[key].host);
    setSmtpPort(String(SMTP_PRESETS[key].port));
  }

  async function handleConnectSmtp() {
    setLocalError(null);
    setSaved(false);
    setTestSent(false);

    const input: SmtpConnectInput = {
      smtpHost: smtpHost.trim(),
      smtpPort: Number(smtpPort) || 587,
      smtpUser: smtpUser.trim(),
      smtpFrom: (smtpFrom.trim() || smtpUser.trim()),
      notifyEmails: emailInput.trim(),
    };

    if (smtpPassword.trim()) {
      input.smtpPassword = smtpPassword.trim();
    }

    try {
      await connectSmtp(input);
      setSaved(true);
      setSmtpPassword("");
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not connect email",
      );
    }
  }

  async function handleSaveRecipients() {
    setLocalError(null);
    setSaved(false);
    try {
      await saveEmails(emailInput);
      setSaved(true);
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not save notification emails",
      );
    }
  }

  async function handleTestEmail() {
    setLocalError(null);
    setTestSent(false);
    try {
      await sendTestEmail();
      setTestSent(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Test email failed");
    }
  }

  const displayError = localError ?? error;
  const slackReady = status?.slackOAuthAvailable ?? false;
  const smtpConnected = status?.smtpConnected ?? false;

  const content = (
    <>
        <div className="rounded-lg border border-qb-border bg-qb-bg px-3 py-3 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-qb-text">Slack</p>
              <p className="text-xs text-qb-text-muted">
                One-click connect — pick the channel during install
              </p>
            </div>
            {status?.slackConnected ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                  <IconCheck className="h-3.5 w-3.5" />
                  {status.slackChannelName ?? "Connected"}
                  {status.slackTeamName ? ` · ${status.slackTeamName}` : ""}
                </span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void disconnectSlack()}
                  className="qb-btn-secondary text-xs disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={!loaded || !slackReady || saving}
                onClick={connectSlack}
                className="qb-btn-primary shrink-0 disabled:opacity-50"
              >
                Add to Slack
              </button>
            )}
          </div>
          {!slackReady && loaded ? (
            <p className="text-xs text-qb-text-muted">
              Slack OAuth is not enabled on this deployment yet.
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border border-qb-border bg-qb-bg px-3 py-3 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-qb-text">Email (SMTP)</p>
              <p className="text-xs text-qb-text-muted">
                Connect your mailbox so alerts send from your address. Use an app
                password for Gmail, Outlook, or Yahoo.
              </p>
            </div>
            {smtpConnected ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
                  <IconCheck className="h-3.5 w-3.5" />
                  {status?.smtpFrom ?? status?.smtpUser ?? "Connected"}
                </span>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void disconnectSmtp()}
                  className="qb-btn-secondary text-xs disabled:opacity-50"
                >
                  Disconnect
                </button>
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-qb-text">
              Provider preset
              <select
                value={preset}
                onChange={(event) =>
                  applyPreset(event.target.value as SmtpPresetKey)
                }
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm"
              >
                {Object.entries(SMTP_PRESETS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs font-medium text-qb-text">
              SMTP port
              <input
                type="number"
                value={smtpPort}
                onChange={(event) => setSmtpPort(event.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-qb-text sm:col-span-2">
              SMTP host
              <input
                type="text"
                value={smtpHost}
                onChange={(event) => setSmtpHost(event.target.value)}
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-qb-text">
              Email / username
              <input
                type="email"
                value={smtpUser}
                onChange={(event) => setSmtpUser(event.target.value)}
                placeholder="you@gmail.com"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-qb-text">
              From address
              <input
                type="email"
                value={smtpFrom}
                onChange={(event) => setSmtpFrom(event.target.value)}
                placeholder="Same as username if blank"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-qb-text sm:col-span-2">
              App password
              <input
                type="password"
                value={smtpPassword}
                onChange={(event) => setSmtpPassword(event.target.value)}
                placeholder={
                  smtpConnected
                    ? "Leave blank to keep existing password"
                    : "Required for first connect"
                }
                disabled={saving}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium text-qb-text sm:col-span-2">
              Alert recipients (comma-separated)
              <input
                type="text"
                value={emailInput}
                onChange={(event) => {
                  setEmailInput(event.target.value);
                  setSaved(false);
                }}
                placeholder="maintenance@example.com, renee@example.com"
                disabled={saving}
                className="mt-1 w-full rounded-lg border border-qb-border bg-white px-3 py-2 text-sm"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={
                saving ||
                !smtpHost.trim() ||
                !smtpUser.trim() ||
                !emailInput.trim() ||
                (!smtpConnected && !smtpPassword.trim())
              }
              onClick={() => void handleConnectSmtp()}
              className="qb-btn-primary disabled:opacity-50"
            >
              {saving
                ? "Connecting…"
                : smtpConnected
                  ? "Update SMTP settings"
                  : "Connect email"}
            </button>
            {smtpConnected ? (
              <>
                <button
                  type="button"
                  disabled={saving || !emailInput.trim()}
                  onClick={() => void handleSaveRecipients()}
                  className="qb-btn-secondary disabled:opacity-50"
                >
                  Save recipients only
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleTestEmail()}
                  className="qb-btn-secondary disabled:opacity-50"
                >
                  Send test email
                </button>
              </>
            ) : null}
          </div>

          {saved ? (
            <p className="text-xs font-semibold text-emerald-700">
              Email settings saved.
            </p>
          ) : null}
          {testSent ? (
            <p className="text-xs font-semibold text-emerald-700">
              Test email sent to your recipients.
            </p>
          ) : null}
        </div>

        {status?.notificationsConfigured ? (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5 text-sm text-emerald-800">
            <IconCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Work order alerts are configured for your account.
          </div>
        ) : loaded ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5 text-sm text-amber-900">
            Connect Slack or connect SMTP with at least one recipient so ORANGE
            receipts notify your team.
          </div>
        ) : null}

        {displayError ? (
          <div className="flex items-start gap-2 rounded-lg border border-qb-danger/30 bg-qb-danger-bg px-3 py-2.5 text-sm text-qb-danger">
            <IconX className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{displayError}</span>
          </div>
        ) : null}
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <section className="qb-card overflow-hidden">
      <div className="qb-card-header">
        <h2 className="qb-section-title">Work order alerts</h2>
        <p className="qb-section-desc">
          When a billable receipt has no work order, Moodna notifies your team
          immediately (ORANGE in Google Sheets).
        </p>
      </div>
      <div className="qb-card-body space-y-4">{content}</div>
    </section>
  );
}
