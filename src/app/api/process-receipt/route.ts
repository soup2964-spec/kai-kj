import { NextResponse } from "next/server";
import {
  parseReceiptAgentResult,
  type ReceiptAgentState,
} from "@/lib/agent/receipt-state";
import { mapAgentStateToExpense } from "@/lib/agent/map-state-to-expense";
import { parseOwnerId } from "@/lib/expense-api";
import { runStatementReconciliation } from "@/lib/reconcile-service";

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

/**
 * Full LangGraph receipt pipeline.
 *
 * Requires AGENT_SERVICE_URL pointing at the Python agent (agent/README.md).
 * Returns agent state + mapped Expense for the dashboard.
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

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing receipt image." }, { status: 400 });
    }

    const agentForm = new FormData();
    agentForm.set("image", file);

    const ownerId = incoming.get("ownerId");
    if (typeof ownerId === "string" && ownerId.trim()) {
      agentForm.set("owner_id", ownerId.trim());
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const receiptImage = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;

    const expense = mapAgentStateToExpense(state, { receiptImage });

    let reconciledExpense = expense;
    let reconciliation = null;

    const ownerIdRaw = incoming.get("ownerId");
    if (typeof ownerIdRaw === "string" && ownerIdRaw.trim()) {
      try {
        const ownerId = parseOwnerId(ownerIdRaw);
        const recon = await runStatementReconciliation({
          ownerId,
          expenseIds: [expense.id],
          expenses: [expense],
        });
        reconciliation = recon.summary;
        reconciledExpense =
          recon.updatedExpenses.find((item) => item.id === expense.id) ??
          expense;
      } catch {
        // Reconciliation is best-effort during agent processing.
      }
    }

    return NextResponse.json({
      agent: result,
      expense: reconciledExpense,
      reconciliation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to process receipt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
