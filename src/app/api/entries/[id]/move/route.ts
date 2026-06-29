import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeEntry, positionToDb, entryInclude } from "@/lib/entries";
import { getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { moveEntrySchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const id = Number((await params).id);
  const existing = await prisma.entry.findUnique({ where: { id } });
  if (!existing) return jsonError("Entrée introuvable", 404);
  if (existing.status === "DECOMMISSIONED") {
    return jsonError("Entrée décommissionnée");
  }

  const body = await request.json();
  const parsed = moveEntrySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const location = positionToDb(parsed.data.position);
  if (location.locationRow) {
    const occupied = await prisma.entry.findFirst({
      where: {
        status: "ACTIVE",
        id: { not: id },
        locationRow: location.locationRow,
        locationLevel: location.locationLevel,
        locationColumn: location.locationColumn,
      },
    });
    if (occupied) {
      return jsonError("Cet emplacement est déjà occupé");
    }
  }

  const entry = await prisma.entry.update({
    where: { id },
    data: {
      ...location,
      lastModifiedById: user.id,
    },
    include: entryInclude,
  });

  return NextResponse.json(serializeEntry(entry));
}
