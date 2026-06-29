import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { updateUserSchema } from "@/lib/validations";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { id } = await params;
  const body = await request.json();
  const parsed = updateUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return jsonError("Utilisateur introuvable", 404);

  if (parsed.data.username && parsed.data.username !== existing.username) {
    const duplicate = await prisma.user.findUnique({
      where: { username: parsed.data.username },
    });
    if (duplicate) return jsonError("Ce nom d'utilisateur existe déjà");
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.username ? { username: parsed.data.username } : {}),
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
      ...(parsed.data.password
        ? { passwordHash: await bcrypt.hash(parsed.data.password, 12) }
        : {}),
    },
    select: {
      id: true,
      username: true,
      role: true,
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
  if (id === user.id) {
    return jsonError("Vous ne pouvez pas supprimer votre propre compte");
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return jsonError("Utilisateur introuvable", 404);

  if (existing.role === "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return jsonError("Impossible de supprimer le dernier administrateur");
    }
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
