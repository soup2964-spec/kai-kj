"""Billable rules engine — port of src/lib/billable-engine.ts using shared JSON config."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Literal

BillableStatus = Literal["billable", "non_billable", "review"]
RuleType = Literal[
    "merchant_blocklist",
    "merchant_allowlist",
    "category",
    "amount_over",
    "line_item_keyword",
]

EVALUATION_PHASES: list[dict[str, Any]] = [
    {"types": ["merchant_blocklist"]},
    {"types": ["line_item_keyword"], "statuses": ["non_billable"]},
    {"types": ["category"], "statuses": ["non_billable"]},
    {"types": ["merchant_allowlist"]},
    {"types": ["amount_over"]},
    {"types": ["line_item_keyword"], "statuses": ["billable", "review"]},
    {"types": ["category"], "statuses": ["billable", "review"]},
]


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[4]


def load_billable_rules() -> dict[str, Any]:
    path = _repo_root() / "src" / "config" / "billable-rules.json"
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def _normalize_text(value: str) -> str:
    return value.lower().strip()


def _merchant_matches(merchant: str, patterns: list[str]) -> bool:
    normalized = _normalize_text(merchant)
    return any(_normalize_text(pattern) in normalized for pattern in patterns)


def _line_items_text(receipt: dict[str, Any]) -> str:
    items = receipt.get("line_items") or receipt.get("lineItems") or []
    return " ".join(_normalize_text(str(item.get("name", ""))) for item in items)


def _evaluate_rule(rule: dict[str, Any], receipt: dict[str, Any]) -> bool:
    rule_type = rule["type"]
    merchant = str(receipt.get("merchant") or receipt.get("vendor") or "")

    if rule_type in ("merchant_blocklist", "merchant_allowlist"):
        return _merchant_matches(merchant, rule.get("patterns") or [])

    if rule_type == "category":
        return receipt.get("category") in (rule.get("categories") or [])

    if rule_type == "amount_over":
        max_amount = rule.get("maxAmount")
        return (
            receipt.get("category") == rule.get("category")
            and isinstance(max_amount, (int, float))
            and float(receipt.get("amount") or 0) > float(max_amount)
        )

    if rule_type == "line_item_keyword":
        haystack = f"{_normalize_text(merchant)} {_line_items_text(receipt)}"
        return any(
            _normalize_text(keyword) in haystack for keyword in (rule.get("keywords") or [])
        )

    return False


def _find_matching_rule(
    rules: list[dict[str, Any]],
    receipt: dict[str, Any],
    phase: dict[str, Any],
) -> dict[str, Any] | None:
    phase_types: list[str] = phase["types"]
    phase_statuses = phase.get("statuses")

    for rule in rules:
        if rule["type"] not in phase_types:
            continue
        if phase_statuses and rule.get("billableStatus") not in phase_statuses:
            continue
        if _evaluate_rule(rule, receipt):
            return rule

    return None


def evaluate_billable(
    receipt: dict[str, Any],
    config: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Return billableStatus, billableReason, matchedRuleId."""
    rules_config = config or load_billable_rules()
    rules: list[dict[str, Any]] = rules_config.get("rules") or []

    for phase in EVALUATION_PHASES:
        match = _find_matching_rule(rules, receipt, phase)
        if match:
            return {
                "billableStatus": match["billableStatus"],
                "billableReason": match["reason"],
                "matchedRuleId": match["id"],
            }

    default = rules_config.get("default") or {}
    return {
        "billableStatus": default.get("billableStatus", "review"),
        "billableReason": default.get(
            "reason",
            "Not clearly a property or client expense — needs manual review",
        ),
        "matchedRuleId": None,
    }
