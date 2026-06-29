import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { createBigBagVarietySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const showAll = request.nextUrl.searchParams.get("all") === "1";
  if (showAll && user.role !== "ADMIN") return forbidden();

  const varieties = await prisma.bigBagVariety.findMany({
    where: showAll ? undefined : { isActive: true },
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
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(varieties);
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const parsed = createBigBagVarietySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const existing = await prisma.bigBagVariety.findUnique({
    where: { name: parsed.data.name },
  });
  if (existing) {
    return jsonError("Une variété avec ce nom existe déjà");
  }

  let sortOrder = parsed.data.sortOrder;
  if (sortOrder === undefined) {
    const divers = await prisma.bigBagVariety.findFirst({
      where: { name: "Divers", isActive: true },
      select: { id: true, sortOrder: true },
    });
    if (divers) {
      sortOrder = divers.sortOrder;
      await prisma.bigBagVariety.update({
        where: { id: divers.id },
        data: { sortOrder: divers.sortOrder + 1 },
      });
    } else {
      const maxSort = await prisma.bigBagVariety.aggregate({ _max: { sortOrder: true } });
      sortOrder = (maxSort._max.sortOrder ?? -1) + 1;
    }
  }

  const created = await prisma.bigBagVariety.create({
    data: {
      name: parsed.data.name,
      color: parsed.data.color,
      isBarred: parsed.data.isBarred ?? false,
      sortOrder,
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

  return NextResponse.json(created, { status: 201 });
}
