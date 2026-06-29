"""External integrations — Google Sheets, QuickBooks, maintenance contact, storage."""

from __future__ import annotations

import os
from typing import Any

import httpx


def credit_card_tab_name(card_last_four: str | None) -> str:
    """Correct credit card tab name for Google Sheets (flowchart: correct CC tab)."""
    if card_last_four and len(card_last_four) == 4:
        return f"CC-{card_last_four}"
    return "CC-Unknown"


def credit_card_account_name(card_last_four: str | None) -> str:
    """QuickBooks credit card account label."""
    if card_last_four and len(card_last_four) == 4:
        return f"Credit Card ****{card_last_four}"
    return "Credit Card"


def monthly_folder_path(purchase_date: str | None) -> str:
    """Store Receipt Monthly Folder — YYYY-MM from purchase date."""
    if purchase_date and len(purchase_date) >= 7:
        return f"receipts/{purchase_date[:7]}"
    from datetime import datetime, timezone

    return f"receipts/{datetime.now(timezone.utc).strftime('%Y-%m')}"


def append_google_sheet_row(
    state: dict[str, Any],
    *,
    sheet_status: str | None = None,
    include_work_order: bool = False,
    action: str = "append",
) -> dict[str, Any] | None:
    """
    Write CC transaction to Google Sheets via Moodna API (service account).
    Falls back to GOOGLE_SHEET_APPEND_URL webhook if KAI_KJ_API_URL is unset.
    """
    api_url = os.environ.get("KAI_KJ_API_URL", "").strip().rstrip("/")
    tab = state.get("credit_card_tab") or credit_card_tab_name(state.get("card_last_four"))

    if api_url:
        owner_id = state.get("owner_id")
        payload: dict[str, Any] = {
            "ownerId": owner_id,
            "tab": tab,
            "expenseId": state.get("expense_id"),
            "card_last_four": state.get("card_last_four"),
            "date": state.get("date"),
            "vendor": state.get("vendor"),
            "amount": state.get("amount"),
            "final_category": state.get("final_category") or state.get("category"),
            "category": state.get("category"),
            "billable_status": state.get("billable_status"),
            "billable_reason": state.get("billable_reason"),
            "work_order_number": state.get("work_order_number") if include_work_order else None,
            "credit_card_reconciled": state.get("credit_card_reconciled"),
            "sheetStatus": sheet_status or state.get("status"),
        }

        if action == "update_status":
            payload = {
                "action": "update_status",
                "ownerId": owner_id,
                "tab": tab,
                "expenseId": state.get("expense_id"),
                "rowNumber": state.get("google_sheet_row_number"),
                "sheetStatus": sheet_status or state.get("status"),
                "reconciled": state.get("credit_card_reconciled"),
            }
        elif action == "replace":
            row_payload = {
                "expense_id": state.get("expense_id"),
                "date": state.get("date"),
                "vendor": state.get("vendor"),
                "amount": state.get("amount"),
                "final_category": state.get("final_category") or state.get("category"),
                "category": state.get("category"),
                "billable_status": state.get("billable_status"),
                "billable_reason": state.get("billable_reason"),
                "work_order_number": state.get("work_order_number"),
                "card_last_four": state.get("card_last_four"),
                "credit_card_reconciled": state.get("credit_card_reconciled"),
            }
            payload = {
                "action": "replace",
                "ownerId": owner_id,
                "tab": tab,
                "expenseId": state.get("expense_id"),
                "rowNumber": state.get("google_sheet_row_number"),
                "sheetStatus": sheet_status or state.get("status"),
                "row": row_payload,
            }
        else:
            payload = {
                "action": "append",
                "ownerId": owner_id,
                "tab": tab,
                "sheetStatus": sheet_status or state.get("status"),
                "row": payload,
            }

        try:
            with httpx.Client(timeout=45.0) as client:
                response = client.post(
                    f"{api_url}/api/google-sheets/append-transaction",
                    json=payload,
                )
                if response.is_success:
                    data = response.json()
                    if data.get("rowNumber"):
                        state["google_sheet_row_number"] = data["rowNumber"]
                    if data.get("tab"):
                        state["google_sheet_tab"] = data["tab"]
                    return {
                        "rowId": data.get("rowId") or data.get("range"),
                        "rowNumber": data.get("rowNumber"),
                        "tab": data.get("tab"),
                        "spreadsheetUrl": data.get("spreadsheetUrl"),
                    }
        except Exception:
            pass

    webhook = os.environ.get("GOOGLE_SHEET_APPEND_URL", "").strip()
    if not webhook:
        return None

    row = {
        "tab": tab,
        "date": state.get("date"),
        "merchant": state.get("vendor"),
        "amount": state.get("amount"),
        "category": state.get("final_category") or state.get("category"),
        "billable_status": state.get("billable_status"),
        "status": sheet_status or state.get("status"),
        "card_last_four": state.get("card_last_four"),
        "expense_id": state.get("expense_id"),
    }
    if include_work_order:
        row["work_order"] = state.get("work_order_number")

    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            webhook,
            json={"source": "kai-agent", "action": "append_row", "row": row},
        )
        response.raise_for_status()
        try:
            data = response.json()
            return {
                "rowId": str(data.get("rowId") or data.get("id") or data.get("range") or ""),
                "rowNumber": data.get("rowNumber"),
                "tab": tab,
            }
        except Exception:
            return {"rowId": f"{tab}:appended", "tab": tab}


def upload_to_quickbooks(
    state: dict[str, Any],
    *,
    with_work_order: bool = False,
) -> str:
    """Upload to QuickBooks — correct credit card account, optionally with WO#."""
    webhook = os.environ.get("ACCOUNTING_WEBHOOK_URL", "").strip()
    expense_id = state.get("expense_id") or "draft"
    fallback_ref = f"KKP-{str(expense_id)[:8].upper()}"

    account = state.get("credit_card_account") or credit_card_account_name(
        state.get("card_last_four")
    )

    expense_payload: dict[str, Any] = {
        "externalId": expense_id,
        "merchant": state.get("vendor"),
        "amount": state.get("amount"),
        "currency": "USD",
        "date": state.get("date"),
        "category": state.get("final_category") or state.get("category"),
        "billableStatus": state.get("billable_status"),
        "creditCardAccount": account,
        "memo": f"{state.get('vendor')} · {state.get('category')}",
    }
    if with_work_order and state.get("work_order_number"):
        expense_payload["workOrderNumber"] = state.get("work_order_number")

    if not webhook:
        return fallback_ref

    headers = {"Content-Type": "application/json"}
    secret = os.environ.get("ACCOUNTING_WEBHOOK_SECRET", "").strip()
    if secret:
        headers["Authorization"] = f"Bearer {secret}"

    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            webhook,
            json={"source": "kai-kj-agent", "expense": expense_payload},
            headers=headers,
        )
        response.raise_for_status()
        try:
            data = response.json()
            return str(data.get("referenceId") or data.get("id") or fallback_ref)
        except Exception:
            return fallback_ref


def _work_order_alert_lines(state: dict[str, Any]) -> list[str]:
    amount = state.get("amount")
    if isinstance(amount, (int, float)):
        amount_str = f"${amount:.2f}"
    else:
        amount_str = str(amount)

    tab = state.get("google_sheet_tab") or state.get("credit_card_tab") or "CC tab"
    lines = [
        "Work order needed for billable receipt (ORANGE in Google Sheets).",
        f"Vendor: {state.get('vendor')}",
        f"Amount: {amount_str}",
        f"Date: {state.get('date')}",
        f"Card: ****{state.get('card_last_four') or '????'}",
        f"Expense ID: {state.get('expense_id')}",
        f"Sheet tab: {tab}",
        "Action: Add AppFolio work order (xx-xxxx) to the ORANGE row, then resume processing.",
    ]
    return lines


def _work_order_alert_text(state: dict[str, Any]) -> str:
    return "\n".join(_work_order_alert_lines(state))


def _send_slack_work_order_alert(state: dict[str, Any], message: str) -> str | None:
    webhook = os.environ.get("SLACK_WEBHOOK_URL", "").strip()
    if not webhook:
        return None

    vendor = state.get("vendor") or "Unknown vendor"
    amount = state.get("amount")
    amount_label = f"${amount:.2f}" if isinstance(amount, (int, float)) else str(amount)

    payload = {
        "text": f"Work order needed: {vendor} {amount_label}",
        "blocks": [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "Work order needed (ORANGE receipt)"},
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": message.replace("\n", "\n")},
            },
        ],
    }

    with httpx.Client(timeout=30.0) as client:
        response = client.post(webhook, json=payload)
        response.raise_for_status()

    return "Slack notification sent"


def _send_email_work_order_alert(state: dict[str, Any], message: str) -> str | None:
    import smtplib
    from email.message import EmailMessage

    raw_recipients = os.environ.get("AGENT_NOTIFY_EMAIL", "").strip()
    if not raw_recipients:
        return None

    recipients = [email.strip() for email in raw_recipients.split(",") if email.strip()]
    if not recipients:
        return None

    smtp_host = os.environ.get("SMTP_HOST", "").strip()
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "").strip()
    smtp_password = os.environ.get("SMTP_PASSWORD", "").strip()
    smtp_from = os.environ.get("SMTP_FROM", smtp_user).strip()

    if not smtp_host or not smtp_from:
        return None

    vendor = state.get("vendor") or "Receipt"
    msg = EmailMessage()
    msg["Subject"] = f"[Moodna] Work order needed — {vendor}"
    msg["From"] = smtp_from
    msg["To"] = ", ".join(recipients)
    msg.set_content(message)

    with smtplib.SMTP(smtp_host, smtp_port, timeout=30) as server:
        server.starttls()
        if smtp_user and smtp_password:
            server.login(smtp_user, smtp_password)
        server.send_message(msg)

    return f"Email sent to {', '.join(recipients)}"


def notify_maintenance_or_renee(state: dict[str, Any], attempt: int) -> str:
    """
    Notify via the user's connected Slack/email settings in Moodna (Next.js API).
    Falls back to legacy platform env vars when KAI_KJ_API_URL is unset.
    """
    owner_id = state.get("owner_id")
    api_url = os.environ.get("KAI_KJ_API_URL", "").strip().rstrip("/")

    if api_url and owner_id:
        payload = {
            "ownerId": owner_id,
            "expenseId": state.get("expense_id"),
            "vendor": state.get("vendor"),
            "amount": state.get("amount"),
            "date": state.get("date"),
            "card_last_four": state.get("card_last_four"),
            "google_sheet_tab": state.get("google_sheet_tab"),
            "credit_card_tab": state.get("credit_card_tab"),
            "attempt": attempt,
        }
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{api_url}/api/agent/notify-work-order",
                    json=payload,
                )
                if response.is_success:
                    data = response.json()
                    deliveries = data.get("deliveries") or []
                    if deliveries:
                        return "; ".join(str(item) for item in deliveries)
                    return "Work order notification sent"
                detail = response.text
                try:
                    detail = response.json().get("error", detail)
                except Exception:
                    pass
                return f"Notification failed: {detail}"
        except Exception as exc:
            return f"Notification failed: {exc}"

    message = _work_order_alert_text(state)
    deliveries: list[str] = []

    try:
        slack_result = _send_slack_work_order_alert(state, message)
        if slack_result:
            deliveries.append(slack_result)
    except Exception as exc:
        deliveries.append(f"Slack failed: {exc}")

    try:
        email_result = _send_email_work_order_alert(state, message)
        if email_result:
            deliveries.append(email_result)
    except Exception as exc:
        deliveries.append(f"Email failed: {exc}")

    webhook = os.environ.get("AGENT_NOTIFY_URL", "").strip()
    if webhook:
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    webhook,
                    json={
                        "source": "kai-agent",
                        "action": "contact_maintenance",
                        "attempt": attempt,
                        "message": message,
                        "expense_id": state.get("expense_id"),
                        "vendor": state.get("vendor"),
                        "amount": state.get("amount"),
                        "date": state.get("date"),
                        "card_last_four": state.get("card_last_four"),
                        "google_sheet_tab": state.get("google_sheet_tab")
                        or state.get("credit_card_tab"),
                        "status": "ORANGE",
                    },
                )
                response.raise_for_status()
            deliveries.append("Webhook notification sent")
        except Exception as exc:
            deliveries.append(f"Webhook failed: {exc}")

    if deliveries:
        return "; ".join(deliveries)

    return (
        "[not configured] Connect Slack or add notification emails in Moodna "
        "(Upload statements → Work order alerts)."
    )


def reconcile_credit_card(state: dict[str, Any]) -> bool:
    """
    Reconcile receipt against uploaded statement transactions via Moodna API,
    then optional AGENT_RECONCILE_WEBHOOK_URL.
    """
    api_url = os.environ.get("KAI_KJ_API_URL", "").strip().rstrip("/")
    owner_id = state.get("owner_id")
    expense_id = state.get("expense_id")

    if api_url and owner_id and expense_id:
        expense_payload = {
            "id": expense_id,
            "merchant": state.get("vendor"),
            "amount": state.get("amount"),
            "date": state.get("date"),
            "cardLastFour": state.get("card_last_four"),
            "creditCardReconciled": False,
        }
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{api_url}/api/statements/reconcile",
                    json={
                        "ownerId": owner_id,
                        "expenseId": expense_id,
                        "expenses": [expense_payload],
                    },
                )
                if response.is_success:
                    data = response.json()
                    matches = (data.get("summary") or {}).get("matches") or []
                    if matches:
                        state["statement_transaction_id"] = matches[0].get(
                            "statementTransactionId"
                        )
                        return True
        except Exception:
            pass

    webhook = os.environ.get("AGENT_RECONCILE_WEBHOOK_URL", "").strip()
    if not webhook:
        return bool(state.get("statement_transaction_id"))

    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            webhook,
            json={
                "source": "kai-agent",
                "action": "reconcile_credit_card",
                "card_last_four": state.get("card_last_four"),
                "amount": state.get("amount"),
                "quickbooks_id": state.get("quickbooks_transaction_id"),
                "expense_id": state.get("expense_id"),
                "statement_transaction_id": state.get("statement_transaction_id"),
            },
        )
        response.raise_for_status()

    return True


def store_receipt_in_monthly_folder(state: dict[str, Any]) -> str:
    """
    Store Receipt Monthly Folder — webhook to storage or return computed path.
    Moodna keeps receipt images in Supabase/localStorage via Next.js.
    """
    folder = state.get("monthly_folder_path") or monthly_folder_path(state.get("date"))
    webhook = os.environ.get("AGENT_STORAGE_WEBHOOK_URL", "").strip()

    if webhook:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                webhook,
                json={
                    "source": "kai-agent",
                    "action": "store_receipt",
                    "folder": folder,
                    "expense_id": state.get("expense_id"),
                    "filename": state.get("receipt_filename"),
                    "owner_id": state.get("owner_id"),
                },
            )
            response.raise_for_status()

    return folder
