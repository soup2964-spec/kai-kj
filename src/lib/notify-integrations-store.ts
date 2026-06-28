"use client";

import { useCallback, useEffect, useState } from "react";
import { getOwnerId } from "@/lib/owner-id";

const STORAGE_KEY = "kai-kj-notify";

export interface NotificationIntegrationStatus {
  ownerId: string;
  slackConnected: boolean;
  slackTeamName: string | null;
  slackChannelName: string | null;
  slackConnectedAt: string | null;
  smtpConnected: boolean;
  smtpHost: string | null;
  smtpPort: number;
  smtpUser: string | null;
  smtpFrom: string | null;
  smtpConnectedAt: string | null;
  notifyEmails: string[];
  notifyEmailsRaw: string;
  notifyEmailsUpdatedAt: string | null;
  slackOAuthAvailable: boolean;
  notificationsConfigured: boolean;
  localOnly?: boolean;
}

interface StoredNotify {
  slackConnected: boolean;
  slackTeamName: string | null;
  slackChannelName: string | null;
  notifyEmailsRaw: string;
  smtpConnected: boolean;
}

function readStored(): StoredNotify {
  const empty: StoredNotify = {
    slackConnected: false,
    slackTeamName: null,
    slackChannelName: null,
    notifyEmailsRaw: "",
    smtpConnected: false,
  };

  if (typeof window === "undefined") {
    return empty;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) } as StoredNotify;
  } catch {
    return empty;
  }
}

function writeStored(data: StoredNotify) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function parseJsonResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed",
    );
  }
  return data as NotificationIntegrationStatus;
}

export interface SmtpConnectInput {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  smtpFrom: string;
  notifyEmails: string;
}

export function useNotificationIntegrations() {
  const [status, setStatus] = useState<NotificationIntegrationStatus | null>(
    null,
  );
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const ownerId = getOwnerId();
    const local = readStored();

    try {
      const response = await fetch(
        `/api/integrations/notifications?ownerId=${encodeURIComponent(ownerId)}`,
      );
      const data = await parseJsonResponse(response);
      setStatus(data);
      writeStored({
        slackConnected: data.slackConnected,
        slackTeamName: data.slackTeamName,
        slackChannelName: data.slackChannelName,
        notifyEmailsRaw: data.notifyEmailsRaw,
        smtpConnected: data.smtpConnected,
      });
      setError(null);
    } catch {
      if (local.notifyEmailsRaw || local.slackConnected || local.smtpConnected) {
        setStatus({
          ownerId,
          slackConnected: local.slackConnected,
          slackTeamName: local.slackTeamName,
          slackChannelName: local.slackChannelName,
          slackConnectedAt: null,
          smtpConnected: local.smtpConnected,
          smtpHost: null,
          smtpPort: 587,
          smtpUser: null,
          smtpFrom: null,
          smtpConnectedAt: null,
          notifyEmails: local.notifyEmailsRaw
            .split(",")
            .map((email) => email.trim())
            .filter(Boolean),
          notifyEmailsRaw: local.notifyEmailsRaw,
          notifyEmailsUpdatedAt: null,
          slackOAuthAvailable: false,
          notificationsConfigured: Boolean(
            local.slackConnected ||
              (local.smtpConnected && local.notifyEmailsRaw.trim()),
          ),
          localOnly: true,
        });
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connectSlack = useCallback(() => {
    const ownerId = getOwnerId();
    window.location.href = `/api/integrations/slack/connect?ownerId=${encodeURIComponent(ownerId)}`;
  }, []);

  const disconnectSlack = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const ownerId = getOwnerId();
      const response = await fetch(
        `/api/integrations/slack?ownerId=${encodeURIComponent(ownerId)}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not disconnect Slack",
        );
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect Slack");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [refresh]);

  const saveEmails = useCallback(async (notifyEmails: string) => {
    setSaving(true);
    setError(null);
    try {
      const ownerId = getOwnerId();
      const response = await fetch("/api/integrations/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, notifyEmails }),
      });
      const data = await parseJsonResponse(response);
      setStatus(data);
      writeStored({
        slackConnected: data.slackConnected,
        slackTeamName: data.slackTeamName,
        slackChannelName: data.slackChannelName,
        notifyEmailsRaw: data.notifyEmailsRaw,
        smtpConnected: data.smtpConnected,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save notification emails",
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const connectSmtp = useCallback(async (input: SmtpConnectInput) => {
    setSaving(true);
    setError(null);
    try {
      const ownerId = getOwnerId();
      const response = await fetch("/api/integrations/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, ...input }),
      });
      const data = await parseJsonResponse(response);
      setStatus(data);
      writeStored({
        slackConnected: data.slackConnected,
        slackTeamName: data.slackTeamName,
        slackChannelName: data.slackChannelName,
        notifyEmailsRaw: data.notifyEmailsRaw,
        smtpConnected: data.smtpConnected,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not connect email");
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const disconnectSmtp = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const ownerId = getOwnerId();
      const response = await fetch(
        `/api/integrations/notifications?ownerId=${encodeURIComponent(ownerId)}&target=smtp`,
        { method: "DELETE" },
      );
      const data = await parseJsonResponse(response);
      setStatus(data);
      writeStored({
        slackConnected: data.slackConnected,
        slackTeamName: data.slackTeamName,
        slackChannelName: data.slackChannelName,
        notifyEmailsRaw: data.notifyEmailsRaw,
        smtpConnected: data.smtpConnected,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disconnect email");
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const sendTestEmail = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const ownerId = getOwnerId();
      const response = await fetch("/api/integrations/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId }),
      });
      await parseJsonResponse(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test email failed");
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
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
  };
}
