-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "rsn" TEXT NOT NULL,
    "rsnNormalized" TEXT NOT NULL,
    "rankId" TEXT,
    "joinedAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalLevel" INTEGER,
    "totalXp" BIGINT,
    "skillsJson" JSONB,
    "activitiesJson" JSONB,
    "lastFetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_rsnNormalized_key" ON "Member"("rsnNormalized");

-- CreateIndex
CREATE INDEX "Member_rankId_idx" ON "Member"("rankId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
