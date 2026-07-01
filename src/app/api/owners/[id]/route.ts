import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { updateOwnerSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const body = await request.json();
  const parsed = updateOwnerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const existing = await prisma.owner.findUnique({ where: { id } });
  if (!existing) return jsonError("Propriétaire introuvable", 404);

  if (parsed.data.name && parsed.data.name !== existing.name) {
    const duplicate = await prisma.owner.findUnique({
      where: { name: parsed.data.name },
    });
    if (duplicate) return jsonError("Un propriétaire avec ce nom existe déjà");
  }

  const updated = await prisma.owner.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.sortOrder !== undefined ? { sortOrder: parsed.data.sortOrder } : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
    },
    select: {
      id: true,
      name: true,
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
  const existing = await prisma.owner.findUnique({ where: { id } });
  if (!existing) return jsonError("Propriétaire introuvable", 404);

  const usageCount = await prisma.entry.count({ where: { ownerId: id } });
  if (usageCount > 0) {
    const updated = await prisma.owner.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(updated);
  }

  await prisma.owner.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
