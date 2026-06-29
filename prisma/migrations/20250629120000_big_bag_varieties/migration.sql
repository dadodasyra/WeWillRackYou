-- CreateTable
CREATE TABLE "BigBagVariety" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isBarred" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BigBagVariety_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BigBagVariety_name_key" ON "BigBagVariety"("name");

-- AlterTable
ALTER TABLE "Entry" DROP COLUMN "cerealType",
DROP COLUMN "cerealTypeOther",
ADD COLUMN "bigBagVarietyId" TEXT;

-- CreateIndex
CREATE INDEX "Entry_bigBagVarietyId_idx" ON "Entry"("bigBagVarietyId");

-- AddForeignKey
ALTER TABLE "Entry" ADD CONSTRAINT "Entry_bigBagVarietyId_fkey" FOREIGN KEY ("bigBagVarietyId") REFERENCES "BigBagVariety"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DropEnum
DROP TYPE "CerealType";
