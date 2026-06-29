import { prisma } from "@/lib/db";

export async function resolveBigBagVarietyId(
  varietyId: string | null | undefined,
  kind: "BIG_BAG" | "OTHER",
): Promise<string | null> {
  if (kind !== "BIG_BAG" || !varietyId) return null;

  const variety = await prisma.bigBagVariety.findFirst({
    where: { id: varietyId, isActive: true },
  });
  if (!variety) {
    throw new Error("Variété de big bag invalide ou inactive");
  }
  return variety.id;
}
