"""Hydrate agent state from Moodna KIE scan output (ScannedReceipt JSON)."""

from __future__ import annotations

from typing import Any

from kai_agent.services.integrations import (
    credit_card_account_name,
    credit_card_tab_name,
    monthly_folder_path,
)
from kai_agent.state import ReceiptState


def _line_items_from_payload(payload: dict[str, Any]) -> list[dict[str, Any]]:
    raw = payload.get("lineItems") or payload.get("line_items") or []
    items: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict):
            continue
        items.append(
            {
                "name": str(item.get("name", "")),
                "amount": item.get("amount"),
            }
        )
    return items


def has_prior_extraction(state: ReceiptState) -> bool:
    return bool(state.vendor and state.amount is not None and state.category)


def hydrate_state_from_extraction(
    state: ReceiptState,
    payload: dict[str, Any],
) -> ReceiptState:
    """Populate ReceiptState from /api/scan-receipt JSON."""
    line_items = _line_items_from_payload(payload)
    card_last_four = payload.get("cardLastFour") or payload.get("card_last_four")
    work_order = payload.get("workOrderNumber") or payload.get("work_order_on_receipt")
    category = payload.get("category")
    date = payload.get("date")
    vendor = payload.get("merchant") or payload.get("vendor")
    amount = payload.get("amount")

    return state.model_copy(
        update={
            "extracted_data": payload,
            "vendor": vendor,
            "amount": float(amount) if amount is not None else None,
            "date": date,
            "description": payload.get("categoryReason")
            or payload.get("category_reason")
            or payload.get("description"),
            "line_items": line_items,
            "category": category,
            "category_reason": payload.get("categoryReason")
            or payload.get("category_reason"),
            "confidence": payload.get("confidence"),
            "work_order_on_receipt": work_order,
            "card_last_four": card_last_four,
            "final_category": category,
            "billable_status": payload.get("billableStatus")
            or payload.get("billable_status"),
            "billable_reason": payload.get("billableReason")
            or payload.get("billable_reason"),
            "matched_rule_id": payload.get("matchedRuleId")
            or payload.get("matched_rule_id"),
            "credit_card_tab": credit_card_tab_name(card_last_four),
            "credit_card_account": credit_card_account_name(card_last_four),
            "monthly_folder_path": monthly_folder_path(date),
        }
    )
