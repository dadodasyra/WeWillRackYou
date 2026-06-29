import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { updateBigBagVarietySchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const body = await request.json();
  const parsed = updateBigBagVarietySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const existing = await prisma.bigBagVariety.findUnique({ where: { id } });
  if (!existing) return jsonError("Variété introuvable", 404);

  if (parsed.data.name && parsed.data.name !== existing.name) {
    const duplicate = await prisma.bigBagVariety.findUnique({
      where: { name: parsed.data.name },
    });
    if (duplicate) return jsonError("Une variété avec ce nom existe déjà");
  }

  const updated = await prisma.bigBagVariety.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.color !== undefined ? { color: parsed.data.color } : {}),
      ...(parsed.data.isBarred !== undefined ? { isBarred: parsed.data.isBarred } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
    },
    select: {
      id: true,
      name: true,
      color: true,
      isBarred: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const existing = await prisma.bigBagVariety.findUnique({ where: { id } });
  if (!existing) return jsonError("Variété introuvable", 404);

  const usageCount = await prisma.entry.count({ where: { bigBagVarietyId: id } });
  if (usageCount > 0) {
    const updated = await prisma.bigBagVariety.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        color: true,
        isBarred: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(updated);
  }

  await prisma.bigBagVariety.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
