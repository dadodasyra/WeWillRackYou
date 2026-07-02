import { BigBagVariety, Entry, Owner, User } from "@prisma/client";
import { formatPosition, parsePosition } from "./position";
import type {
  DecommissionReason,
  SerializedBigBagVariety,
  SerializedEntry,
  SerializedOwner,
} from "./validations";

type EntryWithUsers = Entry & {
  createdBy: Pick<User, "username">;
  lastModifiedBy: Pick<User, "username">;
  bigBagVariety: Pick<BigBagVariety, "id" | "name" | "color" | "isBarred"> | null;
  owner: Pick<Owner, "id" | "name">;
};

export function decommissionedWhere(reason: DecommissionReason) {
  return {
    status: "DECOMMISSIONED" as const,
    decommissionReason: reason,
  };
}

export function isRestorableDecommission(entry: {
  status: string;
  decommissionReason: DecommissionReason | null;
}): boolean {
  return (
    entry.status === "DECOMMISSIONED" &&
    (entry.decommissionReason === "GENERAL" || entry.decommissionReason === "OIL_PRESSING")
  );
}

export function isKikirikiEntry(entry: {
  decommissionReason: DecommissionReason | null;
}): boolean {
  return entry.decommissionReason === "KIKIRIKI";
}

export const DECOMMISSION_REASON_LABELS: Record<DecommissionReason, string> = {
  KIKIRIKI: "Ferme du kikiriki",
  OIL_PRESSING: "Pressage d'huile",
  GENERAL: "Décommissionné",
};

export const entryInclude = {
  createdBy: { select: { username: true } },
  lastModifiedBy: { select: { username: true } },
  bigBagVariety: {
    select: { id: true, name: true, color: true, isBarred: true },
  },
  owner: {
    select: { id: true, name: true },
  },
} as const;

function serializeVariety(
  variety: Pick<BigBagVariety, "id" | "name" | "color" | "isBarred"> | null,
): SerializedBigBagVariety | null {
  if (!variety) return null;
  return {
    id: variety.id,
    name: variety.name,
    color: variety.color,
    isBarred: variety.isBarred,
  };
}

function serializeOwner(owner: Pick<Owner, "id" | "name">): SerializedOwner {
  return {
    id: owner.id,
    name: owner.name,
  };
}

export function serializeEntry(entry: EntryWithUsers): SerializedEntry {
  const position =
    entry.locationRow && entry.locationLevel != null && entry.locationColumn
      ? formatPosition({
          row: entry.locationRow as "A",
          level: entry.locationLevel,
          column: entry.locationColumn,
        })
      : null;

  return {
    id: entry.id,
    kind: entry.kind,
    position,
    bigBagVariety: serializeVariety(entry.bigBagVariety),
    owner: serializeOwner(entry.owner),
    year: entry.year,
    weight: entry.weight,
    humidity: entry.humidity,
    description: entry.description,
    status: entry.status,
    decommissionReason: entry.decommissionReason,
    isPaid: entry.isPaid,
    decommissionedAt: entry.decommissionedAt?.toISOString() ?? null,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    createdBy: { username: entry.createdBy.username },
    lastModifiedBy: { username: entry.lastModifiedBy.username },
  };
}

export function positionToDb(positionCode: string | null | undefined) {
  if (!positionCode) {
    return {
      locationRow: null,
      locationLevel: null,
      locationColumn: null,
    };
  }

  const parsed = parsePosition(positionCode);
  if (!parsed) {
    throw new Error("Position invalide");
  }

  return {
    locationRow: parsed.row,
    locationLevel: parsed.level,
    locationColumn: parsed.column,
  };
}

export async function syncEntryIdSequence(prisma: {
  $executeRawUnsafe: (query: string) => Promise<number>;
}) {
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Entry"', 'id'), COALESCE((SELECT MAX(id) FROM "Entry"), 1), true)`,
  );
}
