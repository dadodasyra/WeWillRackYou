import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveBigBagVarietyId } from "@/lib/big-bag-varieties";
import {
  serializeEntry,
  positionToDb,
  entryInclude,
  isArchiveEntry,
} from "@/lib/entries";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { updateEntrySchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError("ID invalide");
  }

  const entry = await prisma.entry.findUnique({
    where: { id },
    include: entryInclude,
  });

  if (!entry) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json(serializeEntry(entry));
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError("ID invalide");
  }

  const existing = await prisma.entry.findUnique({ where: { id } });
  if (!existing) {
    return jsonError("Entrée introuvable", 404);
  }
  if (existing.status === "DECOMMISSIONED") {
    return jsonError("Entrée décommissionnée, modification impossible");
  }

  const body = await request.json();
  const parsed = updateEntrySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const data = parsed.data;
  const kind = data.kind ?? existing.kind;

  let locationUpdate = {};
  if (data.position !== undefined) {
    const location = positionToDb(data.position);
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
    locationUpdate = location;
  }

  let bigBagVarietyUpdate = {};
  if (data.bigBagVarietyId !== undefined) {
    try {
      const resolvedId = await resolveBigBagVarietyId(data.bigBagVarietyId, kind);
      bigBagVarietyUpdate = { bigBagVarietyId: resolvedId };
    } catch {
      return jsonError("Variété de big bag invalide ou inactive");
    }
  } else if (data.kind === "OTHER") {
    bigBagVarietyUpdate = { bigBagVarietyId: null };
  }

  const entry = await prisma.entry.update({
    where: { id },
    data: {
      ...(data.kind ? { kind: data.kind } : {}),
      ...locationUpdate,
      ...bigBagVarietyUpdate,
      ...(data.year !== undefined
        ? { year: kind === "BIG_BAG" ? data.year : null }
        : {}),
      ...(data.weight !== undefined
        ? { weight: kind === "BIG_BAG" ? data.weight : null }
        : {}),
      ...(data.humidity !== undefined
        ? { humidity: kind === "BIG_BAG" ? data.humidity : null }
        : {}),
      ...(data.description !== undefined
        ? { description: data.description?.trim() ?? null }
        : {}),
      lastModifiedById: user.id,
    },
    include: entryInclude,
  });

  return NextResponse.json(serializeEntry(entry));
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return jsonError("ID invalide");
  }

  const existing = await prisma.entry.findUnique({ where: { id } });
  if (!existing) {
    return jsonError("Entrée introuvable", 404);
  }
  if (!isArchiveEntry(existing)) {
    return jsonError("Seules les entrées archivées peuvent être supprimées définitivement");
  }

  await prisma.entry.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
