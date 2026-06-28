/** Normalize AI or user input to exactly 4 digits, or null if invalid. */
export function normalizeCardLastFour(value: unknown): string | null {
  if (value == null || value === "") return null;
  const digits = String(value).replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return last4.length === 4 ? last4 : null;
}

export function formatCardLabel(lastFour: string | null | undefined): string {
  if (!lastFour) return "Unknown card";
  return `Card ····${lastFour}`;
}
