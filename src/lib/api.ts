import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized() {
  return jsonError("Non authentifié", 401);
}

export function forbidden() {
  return jsonError("Accès refusé", 403);
}
