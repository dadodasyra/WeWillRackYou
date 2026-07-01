import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeEntry, entryInclude, isArchiveEntry } from "@/lib/entries";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError("ID invalide");
  }

  const existing = await prisma.entry.findUnique({ where: { id } });
  if (!existing) return jsonError("Entrée introuvable", 404);
  if (!isArchiveEntry(existing)) {
    return jsonError("Seules les entrées archivées peuvent être remises en entrepôt");
  }

  const entry = await prisma.entry.update({
    where: { id },
    data: {
      status: "ACTIVE",
      decommissionForKikiriki: false,
      decommissionedAt: null,
      isPaid: false,
      lastModifiedById: user.id,
    },
    include: entryInclude,
  });

  return NextResponse.json(serializeEntry(entry));
}
