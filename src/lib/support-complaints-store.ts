"use client";

import { useCallback, useEffect, useState } from "react";
import { getOwnerId } from "@/lib/owner-id";
import type { SupportComplaint } from "@/lib/types";

const STORAGE_KEY = "kai-kj-support-complaints";

function readLocalComplaints(): SupportComplaint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SupportComplaint[];
  } catch {
    return [];
  }
}

function writeLocalComplaints(complaints: SupportComplaint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
}

export function useSupportComplaints() {
  const [complaints, setComplaints] = useState<SupportComplaint[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComplaints = useCallback(async () => {
    setError(null);
    const ownerId = getOwnerId();

    try {
      const response = await fetch(
        `/api/support/complaints?ownerId=${encodeURIComponent(ownerId)}`,
      );
      const data = (await response.json()) as {
        complaints?: SupportComplaint[];
        error?: string;
        storage?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not load support inbox.");
      }

      const remoteComplaints = data.complaints ?? [];
      const localComplaints = readLocalComplaints();
      const merged =
        data.storage === "local"
          ? localComplaints
          : mergeComplaints(remoteComplaints, localComplaints);

      setComplaints(merged.sort(sortByCreatedDesc));
      if (data.storage === "local") {
        writeLocalComplaints(merged);
      }
    } catch (loadError) {
      const fallback = readLocalComplaints().sort(sortByCreatedDesc);
      setComplaints(fallback);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load support inbox.",
      );
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadComplaints();
  }, [loadComplaints]);

  const submitComplaint = useCallback(
    async (input: { subject: string; message: string }) => {
      setSubmitting(true);
      setError(null);

      const ownerId = getOwnerId();

      try {
        const response = await fetch("/api/support/complaints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ownerId, complaint: input }),
        });

        const data = (await response.json()) as {
          complaint?: SupportComplaint;
          error?: string;
          storage?: string;
        };

        if (!response.ok || !data.complaint) {
          throw new Error(data.error ?? "Could not submit complaint.");
        }

        setComplaints((current) => {
          const next = [data.complaint!, ...current.filter((item) => item.id !== data.complaint!.id)];
          if (data.storage === "local") {
            writeLocalComplaints(next);
          }
          return next;
        });

        return { ok: true as const };
      } catch (submitError) {
        const message =
          submitError instanceof Error
            ? submitError.message
            : "Could not submit complaint.";
        setError(message);
        return { ok: false as const, error: message };
      } finally {
        setSubmitting(false);
      }
    },
    [],
  );

  return {
    complaints,
    loaded,
    submitting,
    error,
    submitComplaint,
    reload: loadComplaints,
  };
}

function mergeComplaints(
  remoteComplaints: SupportComplaint[],
  localComplaints: SupportComplaint[],
): SupportComplaint[] {
  const byId = new Map<string, SupportComplaint>();

  for (const complaint of localComplaints) {
    byId.set(complaint.id, complaint);
  }

  for (const complaint of remoteComplaints) {
    byId.set(complaint.id, complaint);
  }

  return [...byId.values()];
}

function sortByCreatedDesc(a: SupportComplaint, b: SupportComplaint) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}
