import { promises as fs } from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { deleteBackupFile, getBackupDir, readBackupFile } from "@/lib/backup";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";

type Params = { params: Promise<{ name: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const name = decodeURIComponent((await params).name);
  try {
    const payload = await readBackupFile(name);
    return new NextResponse(`${JSON.stringify(payload, null, 2)}\n`, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${name}"`,
      },
    });
  } catch {
    return jsonError("Sauvegarde introuvable", 404);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  const name = decodeURIComponent((await params).name);
  try {
    await deleteBackupFile(name);
    return NextResponse.json({ success: true });
  } catch (error) {
    const filePath = path.join(getBackupDir(), name);
    try {
      await fs.access(filePath);
    } catch {
      return jsonError("Sauvegarde introuvable", 404);
    }
    return jsonError(
      error instanceof Error ? error.message : "Suppression impossible",
      400,
    );
  }
}
