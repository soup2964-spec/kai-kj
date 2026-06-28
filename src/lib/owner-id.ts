const OWNER_ID_KEY = "kai-kj-owner-id";

export function getOwnerId(): string {
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
