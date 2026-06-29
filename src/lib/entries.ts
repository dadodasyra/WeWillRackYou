import { Entry, User } from "@prisma/client";
import { formatPosition, parsePosition } from "./position";
import type { SerializedEntry } from "./validations";

type EntryWithUsers = Entry & {
  createdBy: Pick<User, "username">;
  lastModifiedBy: Pick<User, "username">;
};

export function serializeEntry(entry: EntryWithUsers): SerializedEntry {
  const position =
    entry.locationRow && entry.locationLevel && entry.locationColumn
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
    cerealType: entry.cerealType,
    cerealTypeOther: entry.cerealTypeOther,
    weight: entry.weight,
    humidity: entry.humidity,
    description: entry.description,
    status: entry.status,
    decommissionForKikiriki: entry.decommissionForKikiriki,
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
