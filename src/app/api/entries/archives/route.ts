import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { archiveEntryWhere, serializeEntry, entryInclude } from "@/lib/entries";
import { forbidden, getSessionUser, unauthorized } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const entries = await prisma.entry.findMany({
    where: archiveEntryWhere,
    include: entryInclude,
    orderBy: { decommissionedAt: "desc" },
  });

  return NextResponse.json(entries.map(serializeEntry));
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const result = await prisma.entry.deleteMany({ where: archiveEntryWhere });

  return NextResponse.json({ deleted: result.count });
}
