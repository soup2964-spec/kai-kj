const OWNER_ID_KEY = "kai-kj-owner-id";

let authenticatedOwnerId: string | null = null;

function getAnonymousOwnerId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  let ownerId = localStorage.getItem(OWNER_ID_KEY);
  if (!ownerId) {
    ownerId = crypto.randomUUID();
    localStorage.setItem(OWNER_ID_KEY, ownerId);
  }

  return ownerId;
}

export function setAuthenticatedOwnerId(ownerId: string | null): void {
  authenticatedOwnerId = ownerId?.trim() || null;
}

/** Stable owner id from Clerk when signed in, otherwise anonymous device id. */
export function getOwnerId(): string {
  if (authenticatedOwnerId) {
    return authenticatedOwnerId;
  }

  return getAnonymousOwnerId();
}

export function getAnonymousOwnerIdForMigration(): string {
  return getAnonymousOwnerId();
}
