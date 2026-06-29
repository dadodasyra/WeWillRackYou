-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "EntryKind" AS ENUM ('BIG_BAG', 'OTHER');

-- CreateEnum
CREATE TYPE "CerealType" AS ENUM ('BLE', 'ORGE', 'MAIS', 'AVOINE', 'COLZA', 'TOURNESOL', 'POIS', 'FEVEROLE', 'AUTRE');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('ACTIVE', 'DECOMMISSIONED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entry" (
    "id" SERIAL NOT NULL,
    "kind" "EntryKind" NOT NULL,
    "locationRow" TEXT,
    "locationLevel" INTEGER,
    "locationColumn" INTEGER,
    "cerealType" "CerealType",
    "cerealTypeOther" VARCHAR(50),
    "weight" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "description" TEXT,
    "status" "EntryStatus" NOT NULL DEFAULT 'ACTIVE',
    "decommissionForKikiriki" BOOLEAN NOT NULL DEFAULT false,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "decommissionedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT NOT NULL,
    "lastModifiedById" TEXT NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "Entry_status_idx" ON "Entry"("status");

-- CreateIndex
CREATE INDEX "Entry_decommissionForKikiriki_decommissionedAt_idx" ON "Entry"("decommissionForKikiriki", "decommissionedAt");

-- CreateIndex
CREATE INDEX "Entry_locationRow_locationLevel_locationColumn_idx" ON "Entry"("locationRow", "locationLevel", "locationColumn");

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
