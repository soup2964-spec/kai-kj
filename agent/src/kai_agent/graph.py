"""
LangGraph receipt agent — faithful to agent framework flowchart.

See: Downloads/agent framework.png
"""

from __future__ import annotations

from typing import Literal

from langgraph.graph import END, START, StateGraph

from kai_agent.nodes import (
    accountant_uses_wo_from_sheets,
    check_billable,
    check_work_order_on_receipt,
    contact_maintenance_renee,
    enter_google_sheets_cc_tab,
    move_research_needed_folder,
    receipt_received,
    reconcile_credit_card_node,
    scan_receipt_to_va,
    set_google_sheet_green,
    set_google_sheet_orange,
    store_receipt_monthly_folder,
    upload_quickbooks_cc_account,
    upload_quickbooks_with_work_order,
    va_upload_google_sheets,
    wait_for_work_order_human,
)
from kai_agent.state import ReceiptState


def route_billable(
    state: ReceiptState,
) -> Literal["check_work_order_on_receipt", "enter_google_sheets_cc_tab"]:
    """Billable? — Yes (incl. review) → WO check; No → non-billable path."""
    if state.billable_status in ("billable", "review"):
        return "check_work_order_on_receipt"
    return "enter_google_sheets_cc_tab"


def route_work_order_on_receipt(
    state: ReceiptState,
) -> Literal["scan_receipt_to_va", "move_research_needed_folder"]:
    """Work Order # on Receipt?"""
    if state.work_order_found and state.work_order_number:
        return "scan_receipt_to_va"
    return "move_research_needed_folder"


def route_after_contact(
    state: ReceiptState,
) -> Literal["wait_for_work_order_human"]:
    """After notify — always pause for human work order (no AI lookup loop)."""
    return "wait_for_work_order_human"


def build_receipt_graph():
    graph = StateGraph(ReceiptState)

    # Shared entry
    graph.add_node("receipt_received", receipt_received)
    graph.add_node("check_billable", check_billable)

    # Non-billable path
    graph.add_node("enter_google_sheets_cc_tab", enter_google_sheets_cc_tab)
    graph.add_node("upload_quickbooks_cc_account", upload_quickbooks_cc_account)

    # Billable — work order gate
    graph.add_node("check_work_order_on_receipt", check_work_order_on_receipt)

    # Research path (no WO on receipt)
    graph.add_node("move_research_needed_folder", move_research_needed_folder)
    graph.add_node("set_google_sheet_orange", set_google_sheet_orange)
    graph.add_node("contact_maintenance_renee", contact_maintenance_renee)
    graph.add_node("wait_for_work_order_human", wait_for_work_order_human)

    # Billable completion path
    graph.add_node("scan_receipt_to_va", scan_receipt_to_va)
    graph.add_node("va_upload_google_sheets", va_upload_google_sheets)
    graph.add_node("accountant_uses_wo_from_sheets", accountant_uses_wo_from_sheets)
    graph.add_node("upload_quickbooks_with_work_order", upload_quickbooks_with_work_order)
    graph.add_node("set_google_sheet_green", set_google_sheet_green)
    graph.add_node("reconcile_credit_card", reconcile_credit_card_node)

    # Terminal (both paths)
    graph.add_node("store_receipt_monthly_folder", store_receipt_monthly_folder)

    # ── Edges ──
    graph.add_edge(START, "receipt_received")
    graph.add_edge("receipt_received", "check_billable")

    graph.add_conditional_edges(
        "check_billable",
        route_billable,
        {
            "check_work_order_on_receipt": "check_work_order_on_receipt",
            "enter_google_sheets_cc_tab": "enter_google_sheets_cc_tab",
        },
    )

    # Non-billable: Sheets → QB → Store
    graph.add_edge("enter_google_sheets_cc_tab", "upload_quickbooks_cc_account")
    graph.add_edge("upload_quickbooks_cc_account", "store_receipt_monthly_folder")

    # Billable: WO on receipt?
    graph.add_conditional_edges(
        "check_work_order_on_receipt",
        route_work_order_on_receipt,
        {
            "scan_receipt_to_va": "scan_receipt_to_va",
            "move_research_needed_folder": "move_research_needed_folder",
        },
    )

    # Research: Folder → ORANGE → Notify → wait for human
    graph.add_edge("move_research_needed_folder", "set_google_sheet_orange")
    graph.add_edge("set_google_sheet_orange", "contact_maintenance_renee")
    graph.add_conditional_edges(
        "contact_maintenance_renee",
        route_after_contact,
        {
            "wait_for_work_order_human": "wait_for_work_order_human",
        },
    )

    # Billable completion chain
    graph.add_edge("scan_receipt_to_va", "va_upload_google_sheets")
    graph.add_edge("va_upload_google_sheets", "accountant_uses_wo_from_sheets")
    graph.add_edge("accountant_uses_wo_from_sheets", "upload_quickbooks_with_work_order")
    graph.add_edge("upload_quickbooks_with_work_order", "set_google_sheet_green")
    graph.add_edge("set_google_sheet_green", "reconcile_credit_card")
    graph.add_edge("reconcile_credit_card", "store_receipt_monthly_folder")

    # Terminals
    graph.add_edge("store_receipt_monthly_folder", END)
    graph.add_edge("wait_for_work_order_human", END)

    return graph.compile()


receipt_graph = build_receipt_graph()
