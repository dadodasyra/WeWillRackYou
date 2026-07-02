import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeEntry, entryInclude } from "@/lib/entries";
import { getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { decommissionEntrySchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const id = Number((await params).id);
  const existing = await prisma.entry.findUnique({ where: { id } });
  if (!existing) return jsonError("Entrée introuvable", 404);
  if (existing.status === "DECOMMISSIONED") {
    return jsonError("Entrée déjà décommissionnée");
  }

  const body = await request.json();
  const parsed = decommissionEntrySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Données invalides");
  }

  const entry = await prisma.entry.update({
    where: { id },
    data: {
      status: "DECOMMISSIONED",
      decommissionReason: parsed.data.reason,
      decommissionedAt: new Date(),
      isPaid: false,
      locationRow: null,
      locationLevel: null,
      locationColumn: null,
      lastModifiedById: user.id,
    },
    include: entryInclude,
  });

  return NextResponse.json(serializeEntry(entry));
}
