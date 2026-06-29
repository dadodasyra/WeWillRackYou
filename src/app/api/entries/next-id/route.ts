import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const last = await prisma.entry.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });

  return NextResponse.json({ nextId: (last?.id ?? 0) + 1 });
}
