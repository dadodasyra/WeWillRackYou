import { CerealType, EntryKind } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeEntry, positionToDb, syncEntryIdSequence } from "@/lib/entries";
import { getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { createEntrySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const status = request.nextUrl.searchParams.get("status") ?? "ACTIVE";
  const unpositioned = request.nextUrl.searchParams.get("unpositioned") === "true";

  const entries = await prisma.entry.findMany({
    where: {
      status: status === "ALL" ? undefined : (status as "ACTIVE" | "DECOMMISSIONED"),
      ...(unpositioned
        ? { locationRow: null, locationLevel: null, locationColumn: null }
        : {}),
    },
    include: {
      createdBy: { select: { username: true } },
      lastModifiedBy: { select: { username: true } },
    },
    orderBy: { id: "asc" },
  });

  return NextResponse.json(entries.map(serializeEntry));
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const body = await request.json();
  const parsed = createEntrySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const data = parsed.data;
  const location = positionToDb(data.position ?? null);

  if (location.locationRow) {
    const occupied = await prisma.entry.findFirst({
      where: {
        status: "ACTIVE",
        locationRow: location.locationRow,
        locationLevel: location.locationLevel,
        locationColumn: location.locationColumn,
      },
    });
    if (occupied) {
      return jsonError("Cet emplacement est déjà occupé");
    }
  }

  if (data.id) {
    const existing = await prisma.entry.findUnique({ where: { id: data.id } });
    if (existing) {
      return jsonError("Cette entrée existe déjà");
    }
  }

  const entry = await prisma.entry.create({
    data: {
      ...(data.id ? { id: data.id } : {}),
      kind: data.kind as EntryKind,
      ...location,
      cerealType: data.kind === "BIG_BAG" ? (data.cerealType as CerealType | null) ?? null : null,
      cerealTypeOther:
        data.kind === "BIG_BAG" && data.cerealType === "AUTRE"
          ? data.cerealTypeOther?.trim() ?? null
          : null,
      weight: data.kind === "BIG_BAG" ? data.weight ?? null : null,
      humidity: data.kind === "BIG_BAG" ? data.humidity ?? null : null,
      description: data.description?.trim() ?? null,
      createdById: user.id,
      lastModifiedById: user.id,
    },
    include: {
      createdBy: { select: { username: true } },
      lastModifiedBy: { select: { username: true } },
    },
  });

  if (data.id) {
    await syncEntryIdSequence(prisma);
  }

  return NextResponse.json(serializeEntry(entry), { status: 201 });
}
