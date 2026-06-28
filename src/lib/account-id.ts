const ACCOUNT_EMAIL_KEY = "kai-kj-account-email";

export function normalizeAccountEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidAccountEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeAccountEmail(value));
}

export function getAccountEmail(): string | null {
  if (typeof window === "undefined") return null;
  const email = localStorage.getItem(ACCOUNT_EMAIL_KEY);
  return email ? normalizeAccountEmail(email) : null;
}

export function setAccountEmail(email: string): string {
  const normalized = normalizeAccountEmail(email);
  if (!isValidAccountEmail(normalized)) {
    throw new Error("Enter a valid email address.");
  }
  localStorage.setItem(ACCOUNT_EMAIL_KEY, normalized);
  return normalized;
}

export function accountEmailToOwnerId(email: string): string {
  return normalizeAccountEmail(email);
}
