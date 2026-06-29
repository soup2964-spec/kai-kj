"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { setAuthenticatedOwnerId } from "@/lib/owner-id";

type AuthOwnerSyncProps = {
  onOwnerChange?: (ownerId: string | null) => void;
};

export function AuthOwnerSync({ onOwnerChange }: AuthOwnerSyncProps) {
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    setAuthenticatedOwnerId(userId ?? null);
    onOwnerChange?.(userId ?? null);
  }, [userId, isLoaded, onOwnerChange]);

  return null;
}
