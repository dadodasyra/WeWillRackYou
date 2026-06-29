import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { createUserSchema } from "@/lib/validations";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { username: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const existing = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });
  if (existing) {
    return jsonError("Ce nom d'utilisateur existe déjà");
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const created = await prisma.user.create({
    data: {
      username: parsed.data.username,
      passwordHash,
      role: parsed.data.role,
    },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
