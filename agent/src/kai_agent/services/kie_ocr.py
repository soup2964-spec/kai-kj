"""Kie.ai Gemini OCR — port of src/lib/kie.ts (cheap per-receipt extraction)."""

from __future__ import annotations

import json
import re
from typing import Any

import httpx

from kai_agent.services.work_order import resolve_work_order_number

KIE_CHAT_URL = "https://api.kie.ai/gemini-3-flash/v1/chat/completions"

EXPENSE_CATEGORIES = [
    "groceries",
    "dining",
    "transportation",
    "shopping",
    "entertainment",
    "health",
    "utilities",
    "travel",
    "business",
    "months",
    "credit_cards",
    "other",
]

SYSTEM_PROMPT = f"""You extract expense data from receipt photos and categorize the purchase.

Return ONLY valid JSON with this shape:
{{
  "merchant": "store or vendor name",
  "amount": 42.99,
  "date": "YYYY-MM-DD",
  "category": "one of: {", ".join(EXPENSE_CATEGORIES)}",
  "categoryReason": "brief explanation for the category",
  "lineItems": [
    {{ "name": "Coffee", "amount": 4.50 }},
    {{ "name": "VISA CREDIT ****1234", "amount": null }}
  ],
  "confidence": 0.95,
  "cardLastFour": "1234",
  "cardBrand": "visa",
  "paymentDetails": "VISA CREDIT ************1234",
  "workOrderNumber": "76-2234"
}}

Rules:
- amount must be the final total paid (after tax), as a number
- date must be the transaction date printed on the receipt (YYYY-MM-DD)
- category must be exactly one of the allowed values
- confidence is 0-1 based on image clarity and extraction certainty
- lineItems must list purchased items visible on the receipt
- workOrderNumber: AppFolio work order xx-xxxx (e.g. 76-2234) or null
- respond with JSON only, no markdown fences or extra text"""


def _extract_text_content(content: Any) -> str:
    if not content:
        return ""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for part in content:
            if (
                isinstance(part, dict)
                and part.get("type") == "text"
                and isinstance(part.get("text"), str)
            ):
                parts.append(part["text"])
        return "".join(parts)
    return ""


def _parse_json_from_model(text: str) -> dict[str, Any]:
    trimmed = text.strip()
    fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", trimmed)
    json_text = fenced.group(1).strip() if fenced else trimmed
    return json.loads(json_text)


def _collect_receipt_text(parsed: dict[str, Any]) -> str:
    line_items = parsed.get("lineItems") or []
    names = "\n".join(str(item.get("name", "")) for item in line_items)
    return "\n".join(
        filter(
            None,
            [
                parsed.get("paymentDetails"),
                names,
                parsed.get("categoryReason"),
                parsed.get("merchant"),
            ],
        )
    )


def scan_receipt_with_kie(
    api_key: str,
    image_base64: str,
    mime_type: str = "image/jpeg",
) -> dict[str, Any]:
    reasoning_efforts = ("high", "medium")
    parsed: dict[str, Any] | None = None
    last_error: RuntimeError | None = None

    for effort in reasoning_efforts:
        payload = {
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Extract and categorize this receipt. Read the payment section "
                                "for card details. Look for AppFolio work order (xx-xxxx)."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime_type};base64,{image_base64}"},
                        },
                    ],
                },
            ],
            "stream": False,
            "reasoning_effort": effort,
        }

        try:
            with httpx.Client(timeout=60.0) as client:
                response = client.post(
                    KIE_CHAT_URL,
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

            data = response.json()
            if not response.is_success:
                message = (data.get("error") or {}).get("message") or f"Kie API error ({response.status_code})"
                raise RuntimeError(message)

            raw = _extract_text_content((data.get("choices") or [{}])[0].get("message", {}).get("content"))
            if not raw:
                raise RuntimeError("Empty response from Gemini")

            parsed = _parse_json_from_model(raw)
            break
        except (RuntimeError, ValueError, json.JSONDecodeError) as exc:
            last_error = RuntimeError(str(exc))

    if parsed is None:
        raise last_error or RuntimeError("Failed to scan receipt")

    receipt_text = _collect_receipt_text(parsed)

    if not parsed.get("merchant") or not isinstance(parsed.get("amount"), (int, float)):
        raise RuntimeError("Invalid receipt data returned")

    if parsed.get("category") not in EXPENSE_CATEGORIES:
        raise RuntimeError(f"Invalid category: {parsed.get('category')}")

    work_order = resolve_work_order_number(
        parsed.get("workOrderNumber"),
        receipt_text,
    )

    line_items = [
        {"name": str(item.get("name", "")), "amount": item.get("amount")}
        for item in (parsed.get("lineItems") or [])
    ]

    return {
        "merchant": parsed["merchant"],
        "vendor": parsed["merchant"],
        "amount": float(parsed["amount"]),
        "date": parsed.get("date"),
        "category": parsed["category"],
        "category_reason": parsed.get("categoryReason", ""),
        "description": parsed.get("categoryReason", ""),
        "line_items": line_items,
        "confidence": float(parsed.get("confidence") or 0.5),
        "work_order_on_receipt": work_order,
        "card_last_four": parsed.get("cardLastFour"),
        "extracted_data": parsed,
    }
