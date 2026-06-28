"""CLI runner for local testing: kai-agent path/to/receipt.jpg"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import uuid
from pathlib import Path

from kai_agent.graph import receipt_graph
from kai_agent.state import ReceiptState


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Kai KJ receipt LangGraph agent")
    parser.add_argument("image", type=Path, help="Path to receipt image")
    parser.add_argument("--owner-id", default=None)
    parser.add_argument("--max-research", type=int, default=5)
    parser.add_argument("--hints", default="", help="Comma-separated work order hints")
    args = parser.parse_args()

    if not os.environ.get("KIE_API_KEY"):
        print("Error: KIE_API_KEY is not set", file=sys.stderr)
        sys.exit(1)

    if not args.image.is_file():
        print(f"Error: file not found: {args.image}", file=sys.stderr)
        sys.exit(1)

    suffix = args.image.suffix.lower()
    mime = "image/jpeg"
    if suffix == ".png":
        mime = "image/png"
    elif suffix == ".webp":
        mime = "image/webp"

    image_b64 = base64.b64encode(args.image.read_bytes()).decode("ascii")
    hints = [h.strip() for h in args.hints.split(",") if h.strip()]

    initial = ReceiptState(
        receipt_image=image_b64,
        receipt_mime_type=mime,
        receipt_filename=args.image.name,
        owner_id=args.owner_id,
        expense_id=str(uuid.uuid4()),
        vendor_work_order_hints=hints,
        max_research_attempts=args.max_research,
    )

    result = receipt_graph.invoke(initial)
    if isinstance(result, ReceiptState):
        payload = result.model_dump(mode="json")
    else:
        payload = ReceiptState.model_validate(result).model_dump(mode="json")

    print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
