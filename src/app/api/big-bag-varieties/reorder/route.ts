import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { reorderBigBagVarietiesSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const body = await request.json();
  const parsed = reorderBigBagVarietiesSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Données invalides");
  }

  const ids = parsed.data.ids;
  const varieties = await prisma.bigBagVariety.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true },
  });

  if (varieties.length !== ids.length) {
    return jsonError("Liste de variétés invalide");
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.bigBagVariety.update({
        where: { id },
        data: { sortOrder: index },
      }),
    ),
  );

  const updated = await prisma.bigBagVariety.findMany({
    where: { isActive: true },
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

  return NextResponse.json(updated);
}
