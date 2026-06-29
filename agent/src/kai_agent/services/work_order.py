"""Work order parsing — port of src/lib/work-order.ts."""

from __future__ import annotations

import re

WORK_ORDER_PATTERN = re.compile(r"^(\d{2})-(\d{3,5})$")

WORK_ORDER_EXTRACT_PATTERNS = [
    re.compile(r"\b(?:wo|w/o|work\s*order)\s*#?\s*(\d{2}-\d{3,5})\b", re.I),
    re.compile(r"\b(\d{2}-\d{3,5})\b"),
]


def _is_likely_date_false_positive(prefix: str, suffix: str) -> bool:
    month = int(prefix)
    year = int(suffix)
    return 1 <= month <= 12 and 2020 <= year <= 2035


def normalize_work_order_number(value: object | None) -> str | None:
    if value is None or value == "":
        return None

    cleaned = str(value).strip().upper()
    cleaned = re.sub(r"^(?:WO|W/O)\s*#?\s*", "", cleaned, flags=re.I)

    strict = WORK_ORDER_PATTERN.match(cleaned)
    if strict:
        prefix, suffix = strict.group(1), strict.group(2)
        if _is_likely_date_false_positive(prefix, suffix):
            return None
        return f"{prefix}-{suffix}"

    for pattern in WORK_ORDER_EXTRACT_PATTERNS:
        match = pattern.search(cleaned)
        if match and match.group(1):
            normalized = normalize_work_order_number(match.group(1))
            if normalized:
                return normalized

    return None


def extract_work_order_from_text(text: str) -> str | None:
    if not text.strip():
        return None

    for line in text.splitlines():
        for pattern in WORK_ORDER_EXTRACT_PATTERNS:
            match = pattern.search(line)
            if match and match.group(1):
                normalized = normalize_work_order_number(match.group(1))
                if normalized:
                    return normalized

    return None


def resolve_work_order_number(explicit: object | None, *text_sources: str | None) -> str | None:
    from_explicit = normalize_work_order_number(explicit)
    if from_explicit:
        return from_explicit

    for source in text_sources:
        if not source:
            continue
        found = extract_work_order_from_text(source)
        if found:
            return found

    return None
