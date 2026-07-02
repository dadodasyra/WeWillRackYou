-- CreateEnum
CREATE TYPE "DecommissionReason" AS ENUM ('KIKIRIKI', 'OIL_PRESSING', 'GENERAL');

-- AlterTable
ALTER TABLE "Entry" ADD COLUMN "decommissionReason" "DecommissionReason";

-- Migrate existing data
UPDATE "Entry"
SET "decommissionReason" = 'KIKIRIKI'
WHERE "status" = 'DECOMMISSIONED' AND "decommissionForKikiriki" = true;

UPDATE "Entry"
SET "decommissionReason" = 'GENERAL'
WHERE "status" = 'DECOMMISSIONED' AND "decommissionForKikiriki" = false;

-- DropIndex
DROP INDEX "Entry_decommissionForKikiriki_decommissionedAt_idx";

-- AlterTable
ALTER TABLE "Entry" DROP COLUMN "decommissionForKikiriki";

-- CreateIndex
CREATE INDEX "Entry_decommissionReason_decommissionedAt_idx" ON "Entry"("decommissionReason", "decommissionedAt");
