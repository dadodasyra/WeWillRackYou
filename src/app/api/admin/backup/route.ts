import { NextResponse } from "next/server";
import { createBackup, deleteAllBackups, listBackupFiles } from "@/lib/backup";
import { forbidden, getSessionUser, unauthorized } from "@/lib/api";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const files = await listBackupFiles();
  return NextResponse.json(files);
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const { payload, written } = await createBackup("manual");

  return NextResponse.json(
    {
      name: written.name,
      type: written.type,
      sizeBytes: written.sizeBytes,
      payloadCreatedAt: payload.createdAt,
      version: payload.version,
      counts: payload.counts,
    },
    { status: 201 },
  );
}

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const deleted = await deleteAllBackups();
  return NextResponse.json({ success: true, deleted });
}
