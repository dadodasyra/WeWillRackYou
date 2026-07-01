import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { createOwnerSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const showAll = request.nextUrl.searchParams.get("all") === "1";
  if (showAll && user.role !== "ADMIN") return forbidden();

  const owners = await prisma.owner.findMany({
    where: showAll ? undefined : { isActive: true },
    select: {
      id: true,
      name: true,
      sortOrder: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(owners);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const parsed = createOwnerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const existing = await prisma.owner.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return jsonError("Un propriétaire avec ce nom existe déjà");
  }

  let sortOrder = parsed.data.sortOrder;
  if (sortOrder === undefined) {
    const maxSort = await prisma.owner.aggregate({ _max: { sortOrder: true } });
    sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
  }

  const created = await prisma.owner.create({
    data: {
      name: parsed.data.name,
      sortOrder,
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

  return NextResponse.json(created, { status: 201 });
}
