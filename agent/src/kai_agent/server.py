"""FastAPI server — invoked by Next.js /api/process-receipt when AGENT_SERVICE_URL is set."""

from __future__ import annotations

import base64
import os
import uuid
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from kai_agent.graph import receipt_graph
from kai_agent.state import ReceiptState

app = FastAPI(title="Moodna Receipt Agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("AGENT_CORS_ORIGINS", "*").split(","),
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "kai-receipt-agent"}


@app.post("/process-receipt")
async def process_receipt(
    image: UploadFile = File(...),
    owner_id: str | None = Form(default=None),
    vendor_work_order_hints: str | None = Form(default=None),
    max_research_attempts: int = Form(default=5),
) -> dict[str, Any]:
    if not os.environ.get("KIE_API_KEY", "").strip():
        raise HTTPException(status_code=500, detail="KIE_API_KEY is not configured")

    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty image")

    hints: list[str] = []
    if vendor_work_order_hints:
        hints = [h.strip() for h in vendor_work_order_hints.split(",") if h.strip()]

    initial = ReceiptState(
        receipt_image=base64.b64encode(raw).decode("ascii"),
        receipt_mime_type=image.content_type or "image/jpeg",
        receipt_filename=image.filename,
        owner_id=owner_id,
        expense_id=str(uuid.uuid4()),
        vendor_work_order_hints=hints,
        max_research_attempts=max(1, min(max_research_attempts, 10)),
    )

    final = receipt_graph.invoke(initial)
    if isinstance(final, ReceiptState):
        return final.model_dump(mode="json")
    return ReceiptState.model_validate(final).model_dump(mode="json")


def main() -> None:
    import uvicorn

    port = int(os.environ.get("AGENT_PORT", "8000"))
    uvicorn.run("kai_agent.server:app", host="0.0.0.0", port=port, reload=False)


if __name__ == "__main__":
    main()
