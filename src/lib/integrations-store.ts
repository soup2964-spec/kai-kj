"use client";

import { useCallback, useEffect, useState } from "react";
import { getOwnerId } from "@/lib/owner-id";
import type { SheetsLayoutConfig } from "@/lib/sheets-layout";
import {
  CC_LEDGER_FIELD_DEFINITIONS,
  DEFAULT_SHEETS_LAYOUT,
} from "@/lib/sheets-layout";

const STORAGE_KEY = "kai-kj-integrations";

export interface GoogleSheetsIntegrationStatus {
  ownerId: string;
  connected: boolean;
  platformSheetsAvailable: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  connectedAt: string | null;
  serviceAccountEmail: string | null;
  usingPlatformDefault: boolean;
  layoutConfig: SheetsLayoutConfig;
  layoutConfigured: boolean;
  layoutValid: boolean;
  layoutErrors: string[];
  fieldDefinitions: typeof CC_LEDGER_FIELD_DEFINITIONS;
  defaultLayout: SheetsLayoutConfig;
  localOnly?: boolean;
}

interface StoredIntegrations {
  googleSheetsCcLedgerId: string | null;
  googleSheetsConnectedAt: string | null;
  googleSheetsLayoutConfig: SheetsLayoutConfig | null;
}

function readStored(): StoredIntegrations {
  if (typeof window === "undefined") {
    return {
      googleSheetsCcLedgerId: null,
      googleSheetsConnectedAt: null,
      googleSheetsLayoutConfig: null,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        googleSheetsCcLedgerId: null,
        googleSheetsConnectedAt: null,
        googleSheetsLayoutConfig: null,
      };
    }
    return JSON.parse(raw) as StoredIntegrations;
  } catch {
    return {
      googleSheetsCcLedgerId: null,
      googleSheetsConnectedAt: null,
      googleSheetsLayoutConfig: null,
    };
  }
}

function writeStored(data: StoredIntegrations) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function parseJsonResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed",
    );
  }
  return data as GoogleSheetsIntegrationStatus;
}

export function useGoogleSheetsIntegration() {
  const [status, setStatus] = useState<GoogleSheetsIntegrationStatus | null>(
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
        `/api/integrations/google-sheets?ownerId=${encodeURIComponent(ownerId)}`,
      );
      const data = await parseJsonResponse(response);

      if (data.localOnly && local.googleSheetsCcLedgerId) {
        setStatus({
          ownerId,
          connected: true,
          platformSheetsAvailable: data.platformSheetsAvailable,
          spreadsheetId: local.googleSheetsCcLedgerId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${local.googleSheetsCcLedgerId}/edit`,
          connectedAt: local.googleSheetsConnectedAt,
          serviceAccountEmail: data.serviceAccountEmail,
          usingPlatformDefault: false,
          layoutConfig:
            local.googleSheetsLayoutConfig ??
            data.layoutConfig ??
            DEFAULT_SHEETS_LAYOUT,
          layoutConfigured: Boolean(local.googleSheetsLayoutConfig),
          layoutValid: true,
          layoutErrors: [],
          fieldDefinitions: data.fieldDefinitions,
          defaultLayout: data.defaultLayout,
          localOnly: true,
        });
      } else {
        setStatus(data);
        writeStored({
          googleSheetsCcLedgerId: data.spreadsheetId,
          googleSheetsConnectedAt: data.connectedAt,
          googleSheetsLayoutConfig: data.layoutConfigured
            ? data.layoutConfig
            : local.googleSheetsLayoutConfig,
        });
      }
      setError(null);
    } catch {
      if (local.googleSheetsCcLedgerId) {
        setStatus({
          ownerId,
          connected: true,
          platformSheetsAvailable: false,
          spreadsheetId: local.googleSheetsCcLedgerId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${local.googleSheetsCcLedgerId}/edit`,
          connectedAt: local.googleSheetsConnectedAt,
          serviceAccountEmail: null,
          usingPlatformDefault: false,
          layoutConfig: local.googleSheetsLayoutConfig ?? DEFAULT_SHEETS_LAYOUT,
          layoutConfigured: Boolean(local.googleSheetsLayoutConfig),
          layoutValid: true,
          layoutErrors: [],
          fieldDefinitions: CC_LEDGER_FIELD_DEFINITIONS,
          defaultLayout: DEFAULT_SHEETS_LAYOUT,
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

  const connect = useCallback(async (spreadsheetUrl: string) => {
    setSaving(true);
    setError(null);

    try {
      const ownerId = getOwnerId();
      const response = await fetch("/api/integrations/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, spreadsheetUrl }),
      });
      const data = await parseJsonResponse(response);
      setStatus(data);

      writeStored({
        googleSheetsCcLedgerId: data.spreadsheetId,
        googleSheetsConnectedAt: data.connectedAt,
        googleSheetsLayoutConfig: readStored().googleSheetsLayoutConfig,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not connect Google Sheets",
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const saveLayout = useCallback(async (layoutConfig: SheetsLayoutConfig) => {
    setSaving(true);
    setError(null);

    try {
      const ownerId = getOwnerId();
      const response = await fetch("/api/integrations/google-sheets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId, layoutConfig }),
      });
      const data = await parseJsonResponse(response);
      setStatus(data);

      writeStored({
        googleSheetsCcLedgerId: data.spreadsheetId ?? readStored().googleSheetsCcLedgerId,
        googleSheetsConnectedAt: data.connectedAt ?? readStored().googleSheetsConnectedAt,
        googleSheetsLayoutConfig: data.layoutConfig,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not save column mapping",
      );
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setSaving(true);
    setError(null);

    try {
      const ownerId = getOwnerId();
      const response = await fetch(
        `/api/integrations/google-sheets?ownerId=${encodeURIComponent(ownerId)}`,
        { method: "DELETE" },
      );
      const data = await parseJsonResponse(response);
      setStatus(data);
      writeStored({
        googleSheetsCcLedgerId: null,
        googleSheetsConnectedAt: null,
        googleSheetsLayoutConfig: null,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not disconnect Google Sheets",
      );
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
    connect,
    saveLayout,
    disconnect,
  };
}

export async function fetchSheetHeaders(options: {
  tab?: string;
  cardLastFour?: string;
}): Promise<{
  tab: string;
  headers: string[];
  suggestedColumns: Partial<Record<string, string>>;
  suggestedLayout: SheetsLayoutConfig;
}> {
  const ownerId = getOwnerId();
  const params = new URLSearchParams({ ownerId });
  if (options.tab) params.set("tab", options.tab);
  if (options.cardLastFour) params.set("cardLastFour", options.cardLastFour);

  const response = await fetch(
    `/api/integrations/google-sheets/headers?${params.toString()}`,
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Could not read headers",
    );
  }
  return data;
}
