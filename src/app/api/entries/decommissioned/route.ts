import { NextRequest, NextResponse } from "next/server";
import { DecommissionReason } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decommissionedWhere, serializeEntry, entryInclude } from "@/lib/entries";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { decommissionReasonSchema } from "@/lib/validations";

const VALID_REASONS = decommissionReasonSchema.options;

function parseReason(value: string | null): DecommissionReason | null {
  if (!value) return null;
  const parsed = decommissionReasonSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const reason = parseReason(request.nextUrl.searchParams.get("reason"));
  if (!reason) {
    return jsonError(`Paramètre reason requis (${VALID_REASONS.join(", ")})`);
  }

  const filter = request.nextUrl.searchParams.get("filter") ?? "all";

  const entries = await prisma.entry.findMany({
    where: {
      ...decommissionedWhere(reason),
      ...(reason === "KIKIRIKI" && filter === "paid" ? { isPaid: true } : {}),
      ...(reason === "KIKIRIKI" && filter === "unpaid" ? { isPaid: false } : {}),
    },
    include: entryInclude,
    orderBy: { decommissionedAt: "desc" },
  });

  return NextResponse.json(entries.map(serializeEntry));
}

export async function DELETE(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const reason = parseReason(request.nextUrl.searchParams.get("reason"));
  if (!reason) {
    return jsonError(`Paramètre reason requis (${VALID_REASONS.join(", ")})`);
  }
  if (reason === "KIKIRIKI") {
    return jsonError("La suppression en masse n'est pas disponible pour Ferme du kikiriki");
  }

  const result = await prisma.entry.deleteMany({ where: decommissionedWhere(reason) });

  return NextResponse.json({ deleted: result.count });
}
