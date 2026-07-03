import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getEntriesFingerprint,
  type EntriesListStatus,
} from "@/lib/entries";
import { getSessionUser, unauthorized } from "@/lib/api";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const status = (request.nextUrl.searchParams.get("status") ?? "ACTIVE") as EntriesListStatus;
  const fingerprint = await getEntriesFingerprint(prisma, status);

  return NextResponse.json({ fingerprint });
}
