import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { syncEntryIdSequence } from "@/lib/entries";

export const BACKUP_VERSION = 1;

const backupCountsSchema = z.object({
  owners: z.number().int().nonnegative(),
  varieties: z.number().int().nonnegative(),
  entries: z.number().int().nonnegative(),
});

const backupOwnerSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const backupVarietySchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  color: z.string(),
  isBarred: z.boolean(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const backupEntrySchema = z.object({
  id: z.number().int().positive(),
  kind: z.enum(["BIG_BAG", "OTHER"]),
  locationRow: z.string().nullable(),
  locationLevel: z.number().int().nullable(),
  locationColumn: z.number().int().nullable(),
  bigBagVarietyId: z.string().min(1).nullable(),
  ownerId: z.string().min(1),
  year: z.number().int().nullable(),
  weight: z.number().nullable(),
  humidity: z.number().nullable(),
  description: z.string().nullable(),
  status: z.enum(["ACTIVE", "DECOMMISSIONED"]),
  decommissionReason: z.enum(["KIKIRIKI", "OIL_PRESSING", "GENERAL"]).nullable(),
  isPaid: z.boolean(),
  decommissionedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdById: z.string().min(1),
  lastModifiedById: z.string().min(1),
  createdByUsername: z.string().min(1).optional(),
  lastModifiedByUsername: z.string().min(1).optional(),
});

export const backupPayloadSchema = z.object({
  version: z.literal(BACKUP_VERSION),
  createdAt: z.string().datetime(),
  counts: backupCountsSchema,
  data: z.object({
    owners: z.array(backupOwnerSchema),
    varieties: z.array(backupVarietySchema),
    entries: z.array(backupEntrySchema),
  }),
});

export type BackupPayload = z.infer<typeof backupPayloadSchema>;

export type BackupType = "manual" | "auto";

export const AUTO_BACKUP_KEEP = 14;
export const MANUAL_BACKUP_KEEP = 200;

export type BackupFileMeta = {
  name: string;
  type: BackupType;
  sizeBytes: number;
  modifiedAt: string;
  payloadCreatedAt: string;
  version: number;
  counts: BackupPayload["counts"];
};

const BACKUP_FILE_RE = /^backup-(?:(manual|auto)-)?\d{8}-\d{6}\.json$/;

function toIso(value: Date) {
  return value.toISOString();
}

function safeBackupName(name: string) {
  if (!BACKUP_FILE_RE.test(name)) {
    throw new Error("Nom de fichier de sauvegarde invalide");
  }
  return name;
}

function backupTypeFromName(name: string): BackupType {
  const match = BACKUP_FILE_RE.exec(name);
  return match?.[1] === "auto" ? "auto" : "manual";
}

function backupFileNameFromNow(type: BackupType, date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}-${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`;
  return `backup-${type}-${stamp}.json`;
}

export function getBackupDir() {
  return process.env.BACKUP_DIR ?? path.join(process.cwd(), "backups");
}

async function ensureBackupDir() {
  await fs.mkdir(getBackupDir(), { recursive: true });
}

export async function buildBackup(): Promise<BackupPayload> {
  const [owners, varieties, entries] = await Promise.all([
    prisma.owner.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.bigBagVariety.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.entry.findMany({
      orderBy: { id: "asc" },
      include: {
        createdBy: { select: { username: true } },
        lastModifiedBy: { select: { username: true } },
      },
    }),
  ]);

  return {
    version: BACKUP_VERSION,
    createdAt: new Date().toISOString(),
    counts: {
      owners: owners.length,
      varieties: varieties.length,
      entries: entries.length,
    },
    data: {
      owners: owners.map((owner) => ({
        id: owner.id,
        name: owner.name,
        sortOrder: owner.sortOrder,
        isActive: owner.isActive,
        createdAt: toIso(owner.createdAt),
        updatedAt: toIso(owner.updatedAt),
      })),
      varieties: varieties.map((variety) => ({
        id: variety.id,
        name: variety.name,
        color: variety.color,
        isBarred: variety.isBarred,
        sortOrder: variety.sortOrder,
        isActive: variety.isActive,
        createdAt: toIso(variety.createdAt),
        updatedAt: toIso(variety.updatedAt),
      })),
      entries: entries.map((entry) => ({
        id: entry.id,
        kind: entry.kind,
        locationRow: entry.locationRow,
        locationLevel: entry.locationLevel,
        locationColumn: entry.locationColumn,
        bigBagVarietyId: entry.bigBagVarietyId,
        ownerId: entry.ownerId,
        year: entry.year,
        weight: entry.weight,
        humidity: entry.humidity,
        description: entry.description,
        status: entry.status,
        decommissionReason: entry.decommissionReason,
        isPaid: entry.isPaid,
        decommissionedAt: entry.decommissionedAt ? toIso(entry.decommissionedAt) : null,
        createdAt: toIso(entry.createdAt),
        updatedAt: toIso(entry.updatedAt),
        createdById: entry.createdById,
        lastModifiedById: entry.lastModifiedById,
        createdByUsername: entry.createdBy.username,
        lastModifiedByUsername: entry.lastModifiedBy.username,
      })),
    },
  };
}

export async function writeBackupFile(payload: BackupPayload, type: BackupType = "manual") {
  await ensureBackupDir();
  const fileName = backupFileNameFromNow(type);
  const filePath = path.join(getBackupDir(), fileName);
  const content = `${JSON.stringify(payload, null, 2)}\n`;
  await fs.writeFile(filePath, content, "utf8");
  const stat = await fs.stat(filePath);
  return {
    name: fileName,
    type,
    path: filePath,
    sizeBytes: stat.size,
  };
}

export async function readBackupFile(name: string): Promise<BackupPayload> {
  await ensureBackupDir();
  const safeName = safeBackupName(name);
  const filePath = path.join(getBackupDir(), safeName);
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;
  return backupPayloadSchema.parse(parsed);
}

export async function deleteBackupFile(name: string): Promise<void> {
  await ensureBackupDir();
  const safeName = safeBackupName(name);
  const filePath = path.join(getBackupDir(), safeName);
  await fs.unlink(filePath);
}

export async function listBackupFiles(): Promise<BackupFileMeta[]> {
  await ensureBackupDir();
  const entries = await fs.readdir(getBackupDir(), { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile() && BACKUP_FILE_RE.test(entry.name));

  const meta = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(getBackupDir(), file.name);
      const [stat, payload] = await Promise.all([
        fs.stat(filePath),
        readBackupFile(file.name),
      ]);
      return {
        name: file.name,
        type: backupTypeFromName(file.name),
        sizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        payloadCreatedAt: payload.createdAt,
        version: payload.version,
        counts: payload.counts,
      } satisfies BackupFileMeta;
    }),
  );

  meta.sort((a, b) => b.name.localeCompare(a.name));
  return meta;
}

export async function pruneBackupsByType(type: BackupType, keep: number): Promise<number> {
  const files = await listBackupFiles();
  const matching = files
    .filter((file) => file.type === type)
    .sort((a, b) => b.name.localeCompare(a.name));
  const toDelete = matching.slice(keep);
  for (const file of toDelete) {
    await deleteBackupFile(file.name);
  }
  return toDelete.length;
}

export async function pruneAutoBackups(keep = AUTO_BACKUP_KEEP): Promise<number> {
  return pruneBackupsByType("auto", keep);
}

export async function pruneManualBackups(keep = MANUAL_BACKUP_KEEP): Promise<number> {
  return pruneBackupsByType("manual", keep);
}

export async function deleteAllBackups(): Promise<number> {
  const files = await listBackupFiles();
  for (const file of files) {
    await deleteBackupFile(file.name);
  }
  return files.length;
}

export async function createBackup(type: BackupType = "manual") {
  const payload = await buildBackup();
  const written = await writeBackupFile(payload, type);
  if (type === "auto") {
    await pruneAutoBackups();
  } else {
    await pruneManualBackups();
  }
  return { payload, written };
}

export async function getLatestAutoBackup(): Promise<BackupFileMeta | null> {
  const files = await listBackupFiles();
  const autos = files
    .filter((file) => file.type === "auto")
    .sort((a, b) => b.payloadCreatedAt.localeCompare(a.payloadCreatedAt));
  return autos[0] ?? null;
}

export function parseBackupPayload(input: unknown): BackupPayload {
  return backupPayloadSchema.parse(input);
}

export async function restoreBackup(payload: BackupPayload, actingUserId: string) {
  const users = await prisma.user.findMany({
    select: { id: true, username: true },
  });

  const byId = new Set(users.map((user) => user.id));
  const byUsername = new Map(users.map((user) => [user.username, user.id]));

  const resolveUserId = (username: string | undefined, id: string) => {
    if (username) {
      const match = byUsername.get(username);
      if (match) return match;
    }
    if (byId.has(id)) return id;
    return actingUserId;
  };

  await prisma.$transaction(async (tx) => {
    await tx.entry.deleteMany();
    await tx.owner.deleteMany();
    await tx.bigBagVariety.deleteMany();

    for (const owner of payload.data.owners) {
      await tx.owner.create({
        data: {
          id: owner.id,
          name: owner.name,
          sortOrder: owner.sortOrder,
          isActive: owner.isActive,
          createdAt: new Date(owner.createdAt),
          updatedAt: new Date(owner.updatedAt),
        },
      });
    }

    for (const variety of payload.data.varieties) {
      await tx.bigBagVariety.create({
        data: {
          id: variety.id,
          name: variety.name,
          color: variety.color,
          isBarred: variety.isBarred,
          sortOrder: variety.sortOrder,
          isActive: variety.isActive,
          createdAt: new Date(variety.createdAt),
          updatedAt: new Date(variety.updatedAt),
        },
      });
    }

    for (const entry of payload.data.entries) {
      const createdById = resolveUserId(entry.createdByUsername, entry.createdById);
      const lastModifiedById = resolveUserId(
        entry.lastModifiedByUsername,
        entry.lastModifiedById,
      );

      await tx.entry.create({
        data: {
          id: entry.id,
          kind: entry.kind,
          locationRow: entry.locationRow,
          locationLevel: entry.locationLevel,
          locationColumn: entry.locationColumn,
          bigBagVarietyId: entry.bigBagVarietyId,
          ownerId: entry.ownerId,
          year: entry.year,
          weight: entry.weight,
          humidity: entry.humidity,
          description: entry.description,
          status: entry.status,
          decommissionReason: entry.decommissionReason,
          isPaid: entry.isPaid,
          decommissionedAt: entry.decommissionedAt ? new Date(entry.decommissionedAt) : null,
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
          createdById,
          lastModifiedById,
        },
      });
    }

    await syncEntryIdSequence(tx);
  });

  return {
    owners: payload.data.owners.length,
    varieties: payload.data.varieties.length,
    entries: payload.data.entries.length,
  };
}
