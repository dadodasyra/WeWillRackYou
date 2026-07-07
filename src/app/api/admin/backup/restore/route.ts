import { NextRequest, NextResponse } from "next/server";
import {
  parseBackupPayload,
  readBackupFile,
  restoreBackup,
} from "@/lib/backup";
import { forbidden, getSessionUser, jsonError, unauthorized } from "@/lib/api";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return unauthorized();
  if (user.role !== "ADMIN") return forbidden();

  let payloadSource = "";
  let payload: unknown;

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (!(file instanceof File)) {
        return jsonError("Fichier de sauvegarde manquant");
      }
      payloadSource = file.name || "upload";
      payload = JSON.parse(await file.text()) as unknown;
    } else {
      const body = (await request.json()) as { name?: string; payload?: unknown };
      if (body.name) {
        payloadSource = body.name;
        payload = await readBackupFile(body.name);
      } else if (body.payload) {
        payloadSource = "payload";
        payload = body.payload;
      } else {
        return jsonError("Corps de requête invalide");
      }
    }
  } catch {
    return jsonError("Fichier de sauvegarde invalide");
  }

  try {
    const parsed = parseBackupPayload(payload);
    const restored = await restoreBackup(parsed, user.id);
    return NextResponse.json({
      success: true,
      source: payloadSource,
      restored,
    });
  } catch {
    return jsonError("Format de sauvegarde invalide");
  }
}
