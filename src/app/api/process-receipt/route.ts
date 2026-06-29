import { NextResponse } from "next/server";
import { mergeScanWithAgent } from "@/lib/agent/merge-scan-with-agent";
import {
  parseReceiptAgentResult,
  type ReceiptAgentState,
} from "@/lib/agent/receipt-state";
import { mapAgentStateToExpense } from "@/lib/agent/map-state-to-expense";
import { parseOwnerId } from "@/lib/expense-api";
import { runStatementReconciliation } from "@/lib/reconcile-service";
import type { ScannedReceipt } from "@/lib/types";

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL?.trim();

async function forwardToAgentService(
  formData: FormData,
): Promise<ReceiptAgentState> {
  if (!AGENT_SERVICE_URL) {
    throw new Error("AGENT_SERVICE_URL is not configured");
  }

  const response = await fetch(`${AGENT_SERVICE_URL.replace(/\/$/, "")}/process-receipt`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : typeof data.error === "string"
          ? data.error
          : "Agent service request failed",
    );
  }

  return data as ReceiptAgentState;
}

function parseExtractedPayload(raw: FormDataEntryValue | null): ScannedReceipt | null {
  if (typeof raw !== "string" || !raw.trim()) {
    return null;
  }

  try {
    return JSON.parse(raw) as ScannedReceipt;
  } catch {
    throw new Error("Invalid extracted receipt payload.");
  }
}

/**
 * Run the LangGraph workflow on pre-extracted receipt data from /api/scan-receipt.
 * KIE OCR runs once in scan-receipt; this route orchestrates billable/WO/Sheets/reconcile.
 */
export async function POST(request: Request) {
  if (!AGENT_SERVICE_URL) {
    return NextResponse.json(
      {
        error:
          "Receipt agent is not configured. Set AGENT_SERVICE_URL and run the Python agent (see agent/README.md).",
        fallback: "/api/scan-receipt",
      },
      { status: 503 },
    );
  }

  try {
    const incoming = await request.formData();
    const file = incoming.get("image");
    const extracted = parseExtractedPayload(incoming.get("extracted"));

    if (!extracted && !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing extracted receipt data or receipt image." },
        { status: 400 },
      );
    }

    const agentForm = new FormData();

    if (file instanceof File) {
      agentForm.set("image", file);
    }

    if (extracted) {
      agentForm.set("extracted_data", JSON.stringify(extracted));
    }

    const ownerId = incoming.get("ownerId");
    if (typeof ownerId === "string" && ownerId.trim()) {
      agentForm.set("owner_id", ownerId.trim());
    }

    const expenseId = incoming.get("expenseId");
    if (typeof expenseId === "string" && expenseId.trim()) {
      agentForm.set("expense_id", expenseId.trim());
    }

    const hints = incoming.get("vendorWorkOrderHints");
    if (typeof hints === "string" && hints.trim()) {
      agentForm.set("vendor_work_order_hints", hints.trim());
    }

    const maxResearch = incoming.get("maxResearchAttempts");
    if (typeof maxResearch === "string" && maxResearch.trim()) {
      agentForm.set("max_research_attempts", maxResearch.trim());
    }

    const state = await forwardToAgentService(agentForm);
    const result = parseReceiptAgentResult(state);

    let receiptImage: string | undefined;
    if (file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      receiptImage = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;
    }

    let expense = extracted
      ? mergeScanWithAgent(extracted, state, {
          expenseId:
            typeof expenseId === "string" && expenseId.trim()
              ? expenseId.trim()
              : undefined,
          receiptImage,
        })
      : mapAgentStateToExpense(state, { receiptImage });

    let reconciliation = null;

    if (typeof ownerId === "string" && ownerId.trim()) {
      try {
        const parsedOwnerId = parseOwnerId(ownerId);
        const recon = await runStatementReconciliation({
          ownerId: parsedOwnerId,
          expenseIds: [expense.id],
          expenses: [expense],
        });
        reconciliation = recon.summary;
        expense =
          recon.updatedExpenses.find((item) => item.id === expense.id) ?? expense;
      } catch {
        // Reconciliation is best-effort during agent processing.
      }
    }

    return NextResponse.json({
      agent: result,
      expense,
      reconciliation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process receipt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
