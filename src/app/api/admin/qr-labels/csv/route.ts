import { NextRequest, NextResponse } from "next/server";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { MAX_LABELS, parseLabelRange } from "@/lib/label-layout";
import { buildEntryQrUrl } from "@/lib/qr";

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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

  const lines = ["id,url"];
  for (let id = from; id <= to; id++) {
    lines.push(`${id},${escapeCsvField(buildEntryQrUrl(id, baseUrl))}`);
  }

  const body = `\uFEFF${lines.join("\r\n")}`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="qr-labels-${from}-${to}.csv"`,
    },
  });
}
