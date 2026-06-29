import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeEntry } from "@/lib/entries";
import { getSessionUser, unauthorized } from "@/lib/api";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const filter = request.nextUrl.searchParams.get("filter") ?? "all";

  const entries = await prisma.entry.findMany({
    where: {
      decommissionForKikiriki: true,
      status: "DECOMMISSIONED",
      ...(filter === "paid" ? { isPaid: true } : {}),
      ...(filter === "unpaid" ? { isPaid: false } : {}),
    },
    include: {
      createdBy: { select: { username: true } },
      lastModifiedBy: { select: { username: true } },
    },
    orderBy: { decommissionedAt: "desc" },
  });

  return NextResponse.json(entries.map(serializeEntry));
}
