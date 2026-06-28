import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { evaluateAndApplyBillable } from "@/lib/billable-engine";
import { scanReceiptWithKie } from "@/lib/kie";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "KIE_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  let imageBase64: string;
  let mimeType = "image/jpeg";

  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing receipt image." },
        { status: 400 },
      );
    }

    mimeType = file.type || mimeType;
    const buffer = Buffer.from(await file.arrayBuffer());
    imageBase64 = buffer.toString("base64");
  } catch {
    return NextResponse.json(
      { error: "Could not read uploaded image." },
      { status: 400 },
    );
  }

  try {
    const extracted = await scanReceiptWithKie(apiKey, imageBase64, mimeType);
    const result = evaluateAndApplyBillable(extracted);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to scan receipt";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
