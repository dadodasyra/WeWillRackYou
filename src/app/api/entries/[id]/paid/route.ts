import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeEntry } from "@/lib/entries";
import { getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const paidSchema = z.object({ isPaid: z.boolean() });

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const id = Number((await params).id);
  const existing = await prisma.entry.findUnique({ where: { id } });
  if (!existing) return jsonError("Entrée introuvable", 404);
  if (!existing.decommissionForKikiriki) {
    return jsonError("Cette entrée n'est pas dans la liste de paiement");
  }

  const body = await request.json();
  const parsed = paidSchema.safeParse(body);
  if (!parsed.success) return jsonError("Données invalides");

  const entry = await prisma.entry.update({
    where: { id },
    data: {
      isPaid: parsed.data.isPaid,
      lastModifiedById: user.id,
    },
    include: {
      createdBy: { select: { username: true } },
      lastModifiedBy: { select: { username: true } },
    },
  });

  return NextResponse.json(serializeEntry(entry));
}
