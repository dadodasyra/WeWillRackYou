import { NextRequest, NextResponse } from "next/server";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { MAX_LABELS, parseLabelRange } from "@/lib/label-layout";
import { generateQrLabelBatch } from "@/lib/sato-sbpl";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const range = parseLabelRange(
    request.nextUrl.searchParams.get("from") ?? undefined,
    request.nextUrl.searchParams.get("to") ?? undefined,
  );

  if (!range) {
    return jsonError(`Invalid range (max ${MAX_LABELS} labels)`, 400);
  }

  const { from, to } = range;
  const baseUrl = process.env.AUTH_URL ?? request.nextUrl.origin;
  const buffer = generateQrLabelBatch({ from, to, baseUrl });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="qr-labels-${from}-${to}.prn"`,
    },
  });
}
