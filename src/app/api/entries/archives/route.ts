import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeEntry, entryInclude } from "@/lib/entries";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const entries = await prisma.entry.findMany({
    where: {
      status: "DECOMMISSIONED",
      decommissionForKikiriki: false,
    },
    include: entryInclude,
    orderBy: { decommissionedAt: "desc" },
  });

  return NextResponse.json(entries.map(serializeEntry));
}
