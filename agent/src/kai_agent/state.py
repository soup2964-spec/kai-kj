"""Receipt workflow state — matches agent framework flowchart + Kai KJ domain."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ReceiptState(BaseModel):
    """
    LangGraph state for the property-management receipt pipeline.

    Flowchart reference: Downloads/agent framework.png
    """

    # --- Input: Receipt Received ---
    receipt_image: Optional[str] = None
    receipt_mime_type: str = "image/jpeg"
    receipt_filename: Optional[str] = None
    owner_id: Optional[str] = None
    expense_id: Optional[str] = None

    # --- OCR extraction (cheap Kie LLM) ---
    extracted_data: dict[str, Any] = Field(default_factory=dict)
    vendor: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[str] = None
    description: Optional[str] = None
    line_items: list[dict[str, Any]] = Field(default_factory=list)
    category: Optional[str] = None
    category_reason: Optional[str] = None
    confidence: Optional[float] = None
    work_order_on_receipt: Optional[str] = None
    card_last_four: Optional[str] = None
    final_category: Optional[str] = None

    # --- Decision: Billable? ---
    is_billable: Optional[bool] = None
    billable_status: Optional[Literal["billable", "non_billable", "review"]] = None
    billable_reason: Optional[str] = None
    matched_rule_id: Optional[str] = None

    # --- Work order tracking ---
    work_order_number: Optional[str] = None
    work_order_found: Optional[bool] = None

    # --- Google Sheet status (ORANGE / GREEN from flowchart) ---
    status: Optional[Literal["ORANGE", "GREEN"]] = None
    google_sheet_row_id: Optional[str] = None
    google_sheet_row_number: Optional[int] = None
    google_sheet_tab: Optional[str] = None
    credit_card_tab: Optional[str] = None

    # --- Research path (billable, no WO on receipt) ---
    in_research_needed_folder: bool = False
    research_attempts: int = 0
    max_research_attempts: int = 5
    contact_maintenance_sent: bool = False
    maintenance_contact_log: list[str] = Field(default_factory=list)

    # --- Billable completion path ---
    va_scanned: bool = False
    va_uploaded_to_sheets: bool = False
    accountant_wo_confirmed: bool = False
    quickbooks_transaction_id: Optional[str] = None
    credit_card_reconciled: bool = False
    credit_card_account: Optional[str] = None
    statement_transaction_id: Optional[str] = None

    # --- Store Receipt Monthly Folder ---
    monthly_folder_path: Optional[str] = None
    receipt_stored: bool = False

    # --- Workflow control ---
    current_step: Optional[str] = None
    workflow_complete: bool = False
    notes: list[str] = Field(default_factory=list)
    vendor_work_order_hints: list[str] = Field(default_factory=list)

    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)

    model_config = {"extra": "ignore"}

    def touch(self) -> datetime:
        self.updated_at = utc_now()
        return self.updated_at
