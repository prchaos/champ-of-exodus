-- AlterTable
ALTER TABLE "Event" ADD COLUMN "createdBy" TEXT;

-- CreateIndex
CREATE INDEX "Event_createdAt_idx" ON "Event"("createdAt");
