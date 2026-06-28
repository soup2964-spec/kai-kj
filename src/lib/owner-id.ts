import {
  accountEmailToOwnerId,
  getAccountEmail,
} from "@/lib/account-id";

const OWNER_ID_KEY = "kai-kj-owner-id";

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

/** Stable owner id: account email when set, otherwise anonymous device id. */
export function getOwnerId(): string {
  const accountEmail = getAccountEmail();
  if (accountEmail) {
    return accountEmailToOwnerId(accountEmail);
  }
  return getAnonymousOwnerId();
}

export function getAnonymousOwnerIdForMigration(): string {
  return getAnonymousOwnerId();
}
