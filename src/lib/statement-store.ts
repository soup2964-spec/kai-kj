"use client";

import { useCallback, useEffect, useState } from "react";
import { getOwnerId } from "@/lib/owner-id";
import type { StatementTransaction, StatementUpload } from "@/lib/statement-types";

const STORAGE_KEY = "kai-kj-statements";

interface StoredStatements {
  uploads: StatementUpload[];
  transactions: StatementTransaction[];
}

function readStored(): StoredStatements {
  if (typeof window === "undefined") {
    return { uploads: [], transactions: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { uploads: [], transactions: [] };
    return JSON.parse(raw) as StoredStatements;
  } catch {
    return { uploads: [], transactions: [] };
  }
}

function writeStored(data: StoredStatements) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function parseJsonResponse(response: Response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data.error === "string" ? data.error : "Request failed",
    );
  }
  return data;
}

export function useStatements() {
  const [uploads, setUploads] = useState<StatementUpload[]>([]);
  const [transactions, setTransactions] = useState<StatementTransaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const refresh = useCallback(async () => {
    const ownerId = getOwnerId();
    const local = readStored();

    try {
      const response = await fetch(
        `/api/statements?ownerId=${encodeURIComponent(ownerId)}`,
      );
      const data = await parseJsonResponse(response);

      if (data.localOnly && local.uploads.length > 0) {
        setUploads(local.uploads);
        setTransactions(local.transactions);
      } else {
        setUploads(data.uploads as StatementUpload[]);
        setTransactions(data.transactions as StatementTransaction[]);
        writeStored({
          uploads: data.uploads,
          transactions: data.transactions,
        });
      }
      setError(null);
    } catch {
      setUploads(local.uploads);
      setTransactions(local.transactions);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const uploadStatement = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);

      const ownerId = getOwnerId();
      const formData = new FormData();
      formData.set("file", file);
      formData.set("ownerId", ownerId);

      try {
        const response = await fetch("/api/statements", {
          method: "POST",
          body: formData,
        });
        const data = await parseJsonResponse(response);

        const nextUploads = [data.upload as StatementUpload, ...uploads];
        const nextTxns = [
          ...(data.transactions as StatementTransaction[]),
          ...transactions,
        ];

        setUploads(nextUploads);
        setTransactions(nextTxns);
        writeStored({ uploads: nextUploads, transactions: nextTxns });

        return {
          upload: data.upload as StatementUpload,
          transactions: data.transactions as StatementTransaction[],
          warnings: (data.warnings as string[]) ?? [],
        };
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not upload statement";
        setError(message);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [uploads, transactions],
  );

  return {
    uploads,
    transactions,
    loaded,
    error,
    uploading,
    uploadStatement,
    refresh,
  };
}
