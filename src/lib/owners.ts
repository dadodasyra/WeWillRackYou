import { prisma } from "@/lib/db";

export const DEFAULT_OWNER_NAME = "EARL Beiner";

export async function getDefaultOwnerId(): Promise<string> {
  const owner = await prisma.owner.findFirst({
    where: { name: DEFAULT_OWNER_NAME, isActive: true },
    select: { id: true },
  });
  if (!owner) {
    throw new Error("Propriétaire par défaut introuvable");
  }
  return owner.id;
}

export async function resolveOwnerId(
  ownerId: string | null | undefined,
): Promise<string> {
  if (ownerId) {
    const owner = await prisma.owner.findFirst({
      where: { id: ownerId, isActive: true },
    });
    if (!owner) {
      throw new Error("Propriétaire invalide ou inactif");
    }
    return owner.id;
  }

  return getDefaultOwnerId();
}
