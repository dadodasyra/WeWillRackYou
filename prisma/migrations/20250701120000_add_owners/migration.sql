-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_name_key" ON "Owner"("name");

-- Seed default owners
INSERT INTO "Owner" ("id", "name", "sortOrder", "isActive", "createdAt", "updatedAt")
VALUES
    ('owner_earl_beiner', 'EARL Beiner', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('owner_ferme_kikiriki', 'Ferme kikiriki', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable: add nullable ownerId first
ALTER TABLE "Entry" ADD COLUMN "ownerId" TEXT;

-- Backfill existing entries with default owner
UPDATE "Entry" SET "ownerId" = 'owner_earl_beiner' WHERE "ownerId" IS NULL;

-- Make ownerId required
ALTER TABLE "Entry" ALTER COLUMN "ownerId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Entry_ownerId_idx" ON "Entry"("ownerId");
