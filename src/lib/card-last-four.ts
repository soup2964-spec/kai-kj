export type CardBrand =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "other";

const CARD_BRAND_LABELS: Record<CardBrand, string> = {
  visa: "Visa",
  mastercard: "Mastercard",
  amex: "Amex",
  discover: "Discover",
  other: "Card",
};

/** Normalize AI or user input to exactly 4 digits, or null if invalid. */
export function normalizeCardLastFour(value: unknown): string | null {
  if (value == null || value === "") return null;
  const digits = String(value).replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return last4.length === 4 ? last4 : null;
}

function isLikelyYear(digits: string): boolean {
  const year = Number(digits);
  return year >= 1990 && year <= 2099;
}

function lineHasCardContext(line: string): boolean {
  return /\b(?:visa|master\s*card|mastercard|amex|american\s*express|discover|diners|jcb|debit|credit|card|acct|account|payment|paid|tender|chip|contactless|swipe|insert|tap)\b/i.test(
    line,
  );
}

function isPlausibleCardDigits(digits: string, line: string): boolean {
  if (digits.length !== 4) return false;
  if (/\d{1,2}:\d{2}/.test(line)) return false;
  if (isLikelyYear(digits) && !lineHasCardContext(line)) return false;
  return true;
}

/**
 * Pull the last 4 card digits from receipt payment text.
 * Handles masked formats (****1234), network labels (VISA ... 1234), and "ending in 1234".
 */
export function extractCardLastFourFromText(text: string): string | null {
  if (!text.trim()) return null;

  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const patterns = [
      /(?:\*{2,}|x{2,}|#{2,}|\.{4,})\s*(\d{4})\b/i,
      /\b(?:\d{4}[\s*-]*){3}(\d{4})\b/,
      /\bending\s+(?:in\s+)?(\d{4})\b/i,
      /\b(?:last\s+4|last\s+four)\D{0,8}(\d{4})\b/i,
      /\b(?:visa|master\s*card|mastercard|amex|american\s*express|discover)\D{0,30}(\d{4})\b/i,
      /\b(?:card|acct|account|payment|paid|tender)\D{0,30}(\d{4})\b/i,
    ];

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match?.[1] && isPlausibleCardDigits(match[1], trimmed)) {
        return match[1];
      }
    }

    if (lineHasCardContext(trimmed)) {
      const maskedTail = trimmed.match(/(\d{4})\s*(?:\*{2,}|x{2,})\b/i);
      if (maskedTail?.[1] && isPlausibleCardDigits(maskedTail[1], trimmed)) {
        return maskedTail[1];
      }
    }
  }

  return null;
}

export function extractCardBrandFromText(text: string): CardBrand | null {
  const normalized = text.toLowerCase();
  if (/\bvisa\b/.test(normalized)) return "visa";
  if (/\b(?:mastercard|master\s*card|mc)\b/.test(normalized)) {
    return "mastercard";
  }
  if (/\b(?:amex|american\s*express)\b/.test(normalized)) {
    return "amex";
  }
  if (/\bdiscover\b/.test(normalized)) return "discover";
  if (lineHasCardContext(normalized)) return "other";
  return null;
}

export function normalizeCardBrand(value: unknown): CardBrand | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "visa") return "visa";
  if (normalized === "mastercard" || normalized === "mc") return "mastercard";
  if (normalized === "amex" || normalized === "american express") return "amex";
  if (normalized === "discover") return "discover";
  if (normalized === "other") return "other";
  return extractCardBrandFromText(value);
}

export function resolveCardLastFour(
  explicit: unknown,
  ...textSources: Array<string | null | undefined>
): string | null {
  const fromExplicit = normalizeCardLastFour(explicit);
  if (fromExplicit) return fromExplicit;

  for (const source of textSources) {
    if (!source) continue;
    const found = extractCardLastFourFromText(source);
    if (found) return found;
  }

  return null;
}

export function resolveCardBrand(
  explicit: unknown,
  ...textSources: Array<string | null | undefined>
): CardBrand | null {
  const fromExplicit = normalizeCardBrand(explicit);
  if (fromExplicit) return fromExplicit;

  for (const source of textSources) {
    if (!source) continue;
    const found = extractCardBrandFromText(source);
    if (found) return found;
  }

  return null;
}

export function formatCardLabel(
  lastFour: string | null | undefined,
  brand?: CardBrand | null,
): string {
  if (!lastFour) return "Unknown card";
  const brandLabel = brand ? CARD_BRAND_LABELS[brand] : "Card";
  return `${brandLabel} ····${lastFour}`;
}
