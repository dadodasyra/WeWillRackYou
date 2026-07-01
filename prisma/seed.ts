import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEPRECATED_TO_CANONICAL: Record<string, string> = {
  "colza black": "Colza",
  "tournesol argent": "Tournesol",
  "blé mélange nuance de jaune": "Blé Mélange",
  "blé variété anciennes jaune": "Blé Variété Anciennes",
  "blé khorazan autre nuance de jaune": "Blé Khorazan",
  "petit épeautre beige": "Petit Épeautre",
  "grand épeautre beige": "Grand Épeautre",
  "blé rouge d'alsace rouge": "Blé Rouge d'Alsace",
  "chanvre vert foncé": "Chanvre",
  "soja bleu foncé": "Soja",
  "févérole violet": "Févérole",
  "sarasin orange": "Sarasin",
  "tourteaux tournesol argent": "Tourteaux Tournesol",
  "tourteaux colza noir": "Tourteaux Colza",
  "tourteaux chanvre vert foncé": "Tourteaux Chanvre",
  "divers gris": "Divers",
  "seigle brun": "Seigle",
  "emer rouge beige": "Emer",
};

const DEFAULT_VARIETIES = [
  { name: "Colza", color: "#1a1a1a", isBarred: false, sortOrder: 0 },
  { name: "Tournesol", color: "#c0c0c0", isBarred: false, sortOrder: 1 },
  { name: "Blé Mélange", color: "#f5d547", isBarred: false, sortOrder: 2 },
  { name: "Blé Variété Anciennes", color: "#e8c547", isBarred: false, sortOrder: 3 },
  { name: "Blé Khorazan", color: "#d4b83a", isBarred: false, sortOrder: 4 },
  { name: "Petit Épeautre", color: "#d4c4a8", isBarred: false, sortOrder: 5 },
  { name: "Grand Épeautre", color: "#c9b896", isBarred: false, sortOrder: 6 },
  { name: "Blé Rouge d'Alsace", color: "#8b2323", isBarred: false, sortOrder: 7 },
  { name: "Chanvre", color: "#1b4332", isBarred: false, sortOrder: 8 },
  { name: "Soja", color: "#1a237e", isBarred: false, sortOrder: 9 },
  { name: "Févérole", color: "#6a1b9a", isBarred: false, sortOrder: 10 },
  { name: "Sarasin", color: "#e65100", isBarred: false, sortOrder: 11 },
  { name: "Tourteaux Tournesol", color: "#c0c0c0", isBarred: true, sortOrder: 12 },
  { name: "Tourteaux Colza", color: "#1a1a1a", isBarred: true, sortOrder: 13 },
  { name: "Tourteaux Chanvre", color: "#1b4332", isBarred: true, sortOrder: 14 },
  { name: "Seigle", color: "#6d4c41", isBarred: false, sortOrder: 15 },
  { name: "Emer", color: "#c4a484", isBarred: false, sortOrder: 16 },
  { name: "Divers", color: "#9e9e9e", isBarred: false, sortOrder: 17 },
] as const;

const DEFAULT_OWNERS = [
  { name: "EARL Beiner", sortOrder: 0 },
  { name: "Ferme kikiriki", sortOrder: 1 },
] as const;

async function migrateDeprecatedVarieties() {
  for (const [oldName, canonicalName] of Object.entries(DEPRECATED_TO_CANONICAL)) {
    const old = await prisma.bigBagVariety.findUnique({ where: { name: oldName } });
    if (!old) continue;

    const canonical = await prisma.bigBagVariety.findUnique({ where: { name: canonicalName } });
    if (canonical && canonical.id !== old.id) {
      await prisma.entry.updateMany({
        where: { bigBagVarietyId: old.id },
        data: { bigBagVarietyId: canonical.id },
      });
    }

    await prisma.bigBagVariety.delete({ where: { id: old.id } });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  for (const variety of DEFAULT_VARIETIES) {
    await prisma.bigBagVariety.upsert({
      where: { name: variety.name },
      update: {
        color: variety.color,
        isBarred: variety.isBarred,
        sortOrder: variety.sortOrder,
        isActive: true,
      },
      create: variety,
    });
  }

  await migrateDeprecatedVarieties();

  for (const owner of DEFAULT_OWNERS) {
    await prisma.owner.upsert({
      where: { name: owner.name },
      update: {
        sortOrder: owner.sortOrder,
        isActive: true,
      },
      create: owner,
    });
  }

  console.log("Utilisateur admin créé (admin / admin123)");
  console.log(`${DEFAULT_VARIETIES.length} variétés de big bags initialisées`);
  console.log(`${DEFAULT_OWNERS.length} propriétaires initialisés`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
