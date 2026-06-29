import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getSessionUser, jsonError, unauthorized } from "@/lib/api";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  const id = Number((await params).id);
  const entry = await prisma.entry.findUnique({ where: { id } });
  if (!entry) return jsonError("Entrée introuvable", 404);

  const baseUrl = process.env.AUTH_URL ?? request.nextUrl.origin;
  const url = `${baseUrl}/entree/${id}`;

  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="qr-${id}.png"`,
    },
  });
}
