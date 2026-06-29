import { NextResponse } from "next/server";
import { apiErrorMessage } from "@/lib/expense-api";
import { authErrorStatus, requireOwnerId } from "@/lib/auth/server";
import {
  detectStatementSourceType,
  parseStatementFile,
} from "@/lib/statement-parser";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchStatementTransactionsForOwner,
  fetchStatementUploadsForOwner,
  insertStatementUpload,
} from "@/lib/supabase/statements";
import type { StatementSourceType } from "@/lib/statement-types";

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

function localUploadFallback(
  ownerId: string,
  filename: string,
  sourceType: StatementSourceType,
  parsed: Awaited<ReturnType<typeof parseStatementFile>>,
) {
  const uploadId = crypto.randomUUID();
  const now = new Date().toISOString();

  const upload = {
    id: uploadId,
    ownerId,
    filename,
    cardLastFour: parsed.cardLastFour ?? null,
    statementPeriod: parsed.statementPeriod ?? null,
    sourceType,
    transactionCount: parsed.transactions.length,
    createdAt: now,
  };

  const transactions = parsed.transactions.map((txn) => ({
    id: crypto.randomUUID(),
    uploadId,
    ownerId,
    cardLastFour: txn.cardLastFour ?? parsed.cardLastFour ?? null,
    txnDate: txn.txnDate,
    merchant: txn.merchant,
    amount: txn.amount,
    description: txn.description ?? null,
    matchedExpenseId: null,
    createdAt: now,
  }));

  return { upload, transactions };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = await requireOwnerId(searchParams.get("ownerId"));

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        uploads: [],
        transactions: [],
        localOnly: true,
      });
    }

    const supabase = createAdminClient();
    const uploads = await fetchStatementUploadsForOwner(supabase, ownerId);
    const transactions = await fetchStatementTransactionsForOwner(
      supabase,
      ownerId,
    );

    return NextResponse.json({ uploads, transactions });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not load statements.") },
      { status: authErrorStatus(error) },
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const incomingOwnerId = formData.get("ownerId");
    const ownerId = await requireOwnerId(
      typeof incomingOwnerId === "string" ? incomingOwnerId : null,
    );

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing statement file." }, { status: 400 });
    }

    const sourceType = detectStatementSourceType(file.name, file.type || "");
    if (!sourceType) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF or CSV statement." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseStatementFile(buffer, file.name, sourceType);

    if (parsed.transactions.length === 0) {
      return NextResponse.json(
        {
          error: parsed.warnings[0] ?? "No transactions found in this statement.",
          warnings: parsed.warnings,
        },
        { status: 400 },
      );
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        const saved = await insertStatementUpload(
          supabase,
          ownerId,
          file.name,
          sourceType,
          parsed,
        );

        return NextResponse.json({
          ...saved,
          warnings: parsed.warnings,
        });
      } catch {
        // Fall through to local-only response when DB tables aren't migrated yet.
      }
    }

    const fallback = localUploadFallback(ownerId, file.name, sourceType, parsed);

    return NextResponse.json({
      ...fallback,
      warnings: [
        ...parsed.warnings,
        ...(isSupabaseConfigured()
          ? ["Saved locally — run Supabase migration for cloud sync."]
          : ["Saved locally — configure Supabase for cloud sync."]),
      ],
    });
  } catch (error) {
    return NextResponse.json(
      { error: apiErrorMessage(error, "Could not parse statement.") },
      { status: authErrorStatus(error) },
    );
  }
}
