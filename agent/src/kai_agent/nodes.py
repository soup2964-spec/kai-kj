"""
LangGraph nodes — each maps 1:1 to agent framework flowchart (Downloads/agent framework.png).

Flow:
  Receipt Received → Billable?
    NO  → Google Sheets (CC tab) → QuickBooks (CC account) → Monthly Folder
    YES → Work Order # on Receipt?
            YES → Scan to VA → VA Sheets → Accountant WO → QB+WO → GREEN → Reconcile → Monthly
            NO  → Research Folder → ORANGE → Notify Maintenance/Renee → wait for human
"""

from __future__ import annotations

import os
from typing import Any

from kai_agent.services.billable_engine import evaluate_billable
from kai_agent.services.integrations import (
    append_google_sheet_row,
    credit_card_account_name,
    credit_card_tab_name,
    monthly_folder_path,
    notify_maintenance_or_renee,
    reconcile_credit_card,
    store_receipt_in_monthly_folder,
    upload_to_quickbooks,
)
from kai_agent.services.kie_ocr import scan_receipt_with_kie
from kai_agent.services.work_order import resolve_work_order_number
from kai_agent.state import ReceiptState


def _sheet_patch(state_dict: dict[str, Any], result: dict[str, Any] | None) -> dict[str, Any]:
    if not result:
        return {}
    patch: dict[str, Any] = {}
    if result.get("rowId"):
        patch["google_sheet_row_id"] = result["rowId"]
    if result.get("rowNumber"):
        patch["google_sheet_row_number"] = result["rowNumber"]
    if result.get("tab"):
        patch["google_sheet_tab"] = result["tab"]
    return patch


def _patch(state: ReceiptState, **updates: Any) -> dict[str, Any]:
    model = state.model_copy(update=updates)
    model.touch()
    return model.model_dump(exclude_none=False)


# ─── Receipt Received ───────────────────────────────────────────────────────


def receipt_received(state: ReceiptState) -> dict[str, Any]:
    """OCR extract via cheap Kie LLM (~same cost as existing /api/scan-receipt)."""
    api_key = os.environ.get("KIE_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("KIE_API_KEY is not configured")
    if not state.receipt_image:
        raise RuntimeError("receipt_image is required")

    extracted = scan_receipt_with_kie(api_key, state.receipt_image, state.receipt_mime_type)
    cc_tab = credit_card_tab_name(extracted.get("card_last_four"))
    cc_account = credit_card_account_name(extracted.get("card_last_four"))
    folder = monthly_folder_path(extracted.get("date"))

    notes = [
        *state.notes,
        f"[receipt_received] {extracted['vendor']} ${extracted['amount']:.2f}",
    ]

    return _patch(
        state,
        current_step="receipt_received",
        extracted_data=extracted["extracted_data"],
        vendor=extracted["vendor"],
        amount=extracted["amount"],
        date=extracted.get("date"),
        description=extracted.get("description"),
        line_items=extracted["line_items"],
        category=extracted["category"],
        category_reason=extracted.get("category_reason"),
        confidence=extracted.get("confidence"),
        work_order_on_receipt=extracted.get("work_order_on_receipt"),
        card_last_four=extracted.get("card_last_four"),
        final_category=extracted["category"],
        credit_card_tab=cc_tab,
        credit_card_account=cc_account,
        monthly_folder_path=folder,
        notes=notes,
    )


# ─── Billable? ───────────────────────────────────────────────────────────────


def check_billable(state: ReceiptState) -> dict[str, Any]:
    """Decision prep: evaluate billable-rules.json (shared with Next.js)."""
    result = evaluate_billable(
        {
            "merchant": state.vendor,
            "amount": state.amount,
            "category": state.category,
            "line_items": state.line_items,
        }
    )
    billable_status = result["billableStatus"]
    is_billable = billable_status == "billable"

    notes = [
        *state.notes,
        f"[check_billable] {'Yes' if is_billable else 'No'} ({billable_status}): {result['billableReason']}",
    ]

    return _patch(
        state,
        current_step="check_billable",
        billable_status=billable_status,
        is_billable=is_billable,
        billable_reason=result["billableReason"],
        matched_rule_id=result.get("matchedRuleId"),
        notes=notes,
    )


# ─── Non-Billable path ───────────────────────────────────────────────────────


def enter_google_sheets_cc_tab(state: ReceiptState) -> dict[str, Any]:
    """Enter in Google Sheets (correct credit card tab)."""
    state_dict = state.model_dump()
    result = append_google_sheet_row(state_dict, sheet_status=None)
    notes = [
        *state.notes,
        f"[enter_google_sheets_cc_tab] Tab={state.credit_card_tab} row={result.get('rowId') if result else 'pending'}",
    ]
    return _patch(
        state,
        current_step="enter_google_sheets_cc_tab",
        notes=notes,
        **_sheet_patch(state_dict, result),
    )


def upload_quickbooks_cc_account(state: ReceiptState) -> dict[str, Any]:
    """Upload to QuickBooks (correct credit card account)."""
    ref = upload_to_quickbooks(state.model_dump(), with_work_order=False)
    notes = [*state.notes, f"[upload_quickbooks_cc_account] {state.credit_card_account} → {ref}"]
    return _patch(
        state,
        current_step="upload_quickbooks_cc_account",
        quickbooks_transaction_id=ref,
        notes=notes,
    )


# ─── Billable: Work Order # on Receipt? ─────────────────────────────────────


def check_work_order_on_receipt(state: ReceiptState) -> dict[str, Any]:
    receipt_text = "\n".join(
        filter(
            None,
            [
                state.description,
                state.vendor,
                "\n".join(str(i.get("name", "")) for i in state.line_items),
            ],
        )
    )
    wo = resolve_work_order_number(state.work_order_on_receipt, receipt_text)

    if wo:
        notes = [*state.notes, f"[check_work_order_on_receipt] Yes — {wo}"]
        return _patch(
            state,
            current_step="check_work_order_on_receipt",
            work_order_number=wo,
            work_order_found=True,
            notes=notes,
        )

    notes = [*state.notes, "[check_work_order_on_receipt] No — research path"]
    return _patch(
        state,
        current_step="check_work_order_on_receipt",
        work_order_found=False,
        notes=notes,
    )


# ─── Research path (no WO on receipt) ────────────────────────────────────────


def move_research_needed_folder(state: ReceiptState) -> dict[str, Any]:
    """Research Needed Folder."""
    folder = f"{state.monthly_folder_path or monthly_folder_path(state.date)}/research-needed"
    notes = [*state.notes, f"[move_research_needed_folder] → {folder}"]
    return _patch(
        state,
        current_step="move_research_needed_folder",
        in_research_needed_folder=True,
        monthly_folder_path=folder,
        notes=notes,
    )


def set_google_sheet_orange(state: ReceiptState) -> dict[str, Any]:
    """Google Sheet Status = ORANGE."""
    state_dict = state.model_dump()
    result = append_google_sheet_row(state_dict, sheet_status="ORANGE")
    notes = [*state.notes, "[set_google_sheet_orange] Status=ORANGE → Google Sheets"]
    return _patch(
        state,
        current_step="set_google_sheet_orange",
        status="ORANGE",
        notes=notes,
        **_sheet_patch(state_dict, result),
    )


def contact_maintenance_renee(state: ReceiptState) -> dict[str, Any]:
    """
    Contact Maintenance or Renee via Slack/email immediately.
    No AI work order lookup — graph pauses for human input after this step.
    """
    contact_log = notify_maintenance_or_renee(state.model_dump(), attempt=1)
    maintenance_log = [*state.maintenance_contact_log, contact_log]
    notes = [
        *state.notes,
        f"[contact_maintenance_renee] {contact_log}",
        "[contact_maintenance_renee] Awaiting human work order — no AI lookup",
    ]
    return _patch(
        state,
        current_step="contact_maintenance_renee",
        research_attempts=1,
        contact_maintenance_sent=True,
        maintenance_contact_log=maintenance_log,
        work_order_found=False,
        notes=notes,
    )


# ─── Billable completion path ────────────────────────────────────────────────


def scan_receipt_to_va(state: ReceiptState) -> dict[str, Any]:
    """Scan Receipt to VA — queue/hand off receipt for VA processing."""
    notes = [*state.notes, "[scan_receipt_to_va] Receipt scanned and sent to VA"]
    return _patch(
        state,
        current_step="scan_receipt_to_va",
        va_scanned=True,
        in_research_needed_folder=False,
        notes=notes,
    )


def va_upload_google_sheets(state: ReceiptState) -> dict[str, Any]:
    """VA uploads CC transaction into Google Sheets."""
    state_dict = state.model_dump()
    if state_dict.get("google_sheet_row_number"):
        result = append_google_sheet_row(
            state_dict,
            sheet_status=state.status,
            include_work_order=True,
            action="replace",
        )
    else:
        result = append_google_sheet_row(
            state_dict,
            sheet_status=state.status,
            include_work_order=True,
        )
    notes = [
        *state.notes,
        f"[va_upload_google_sheets] CC transaction on tab {state.credit_card_tab}",
    ]
    return _patch(
        state,
        current_step="va_upload_google_sheets",
        va_uploaded_to_sheets=True,
        notes=notes,
        **_sheet_patch(state_dict, result),
    )


def accountant_uses_wo_from_sheets(state: ReceiptState) -> dict[str, Any]:
    """Accountant uses WO# from Google Sheets — confirm WO before QB upload."""
    wo = state.work_order_number
    if not wo:
        raise RuntimeError("Accountant step requires work_order_number")

    notes = [
        *state.notes,
        f"[accountant_uses_wo_from_sheets] Accountant confirmed WO {wo} from Google Sheets",
    ]
    return _patch(
        state,
        current_step="accountant_uses_wo_from_sheets",
        accountant_wo_confirmed=True,
        notes=notes,
    )


def upload_quickbooks_with_work_order(state: ReceiptState) -> dict[str, Any]:
    """Upload to QuickBooks with Work Order #."""
    ref = upload_to_quickbooks(state.model_dump(), with_work_order=True)
    notes = [
        *state.notes,
        f"[upload_quickbooks_with_work_order] WO {state.work_order_number} → {ref}",
    ]
    return _patch(
        state,
        current_step="upload_quickbooks_with_work_order",
        quickbooks_transaction_id=ref,
        notes=notes,
    )


def set_google_sheet_green(state: ReceiptState) -> dict[str, Any]:
    """Google Sheet Status = GREEN."""
    state_dict = state.model_dump()
    state_dict["status"] = "GREEN"
    result = append_google_sheet_row(
        state_dict,
        sheet_status="GREEN",
        action="update_status",
    )
    notes = [*state.notes, "[set_google_sheet_green] Status=GREEN → Google Sheets"]
    return _patch(
        state,
        current_step="set_google_sheet_green",
        status="GREEN",
        notes=notes,
        **_sheet_patch(state_dict, result),
    )


def reconcile_credit_card_node(state: ReceiptState) -> dict[str, Any]:
    """Reconcile Credit Card against uploaded statement transactions."""
    state_dict = state.model_dump()
    ok = reconcile_credit_card(state_dict)
    stmt_id = state_dict.get("statement_transaction_id")

    if ok and state_dict.get("google_sheet_row_number"):
        state_dict["credit_card_reconciled"] = True
        append_google_sheet_row(state_dict, action="update_status")

    notes = [
        *state.notes,
        f"[reconcile_credit_card] {'Matched statement ' + str(stmt_id) if stmt_id else 'No statement match'} ****{state.card_last_four or '????'}",
    ]
    return _patch(
        state,
        current_step="reconcile_credit_card",
        credit_card_reconciled=ok and bool(stmt_id),
        statement_transaction_id=stmt_id,
        notes=notes,
        **_sheet_patch(state_dict, None),
    )


# ─── Terminal: Store Receipt Monthly Folder ────────────────────────────────────


def store_receipt_monthly_folder(state: ReceiptState) -> dict[str, Any]:
    """Store Receipt Monthly Folder — both paths end here."""
    folder = monthly_folder_path(state.date)
    stored_path = store_receipt_in_monthly_folder(
        {**state.model_dump(), "monthly_folder_path": folder}
    )
    notes = [*state.notes, f"[store_receipt_monthly_folder] → {stored_path}"]
    return _patch(
        state,
        current_step="store_receipt_monthly_folder",
        monthly_folder_path=stored_path,
        receipt_stored=True,
        workflow_complete=True,
        notes=notes,
    )


def wait_for_work_order_human(state: ReceiptState) -> dict[str, Any]:
    """
    Pause after Slack/email notification — ORANGE row in Sheets, awaiting human WO.
    Resume workflow separately once maintenance adds the work order.
    """
    notes = [
        *state.notes,
        "[wait_for_work_order_human] ORANGE — awaiting Maintenance/Renee response",
    ]
    return _patch(
        state,
        current_step="wait_for_work_order_human",
        status="ORANGE",
        workflow_complete=False,
        notes=notes,
    )
