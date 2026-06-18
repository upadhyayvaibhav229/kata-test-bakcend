-- CreateEnum
CREATE TYPE "Medal" AS ENUM ('GOLD', 'SILVER', 'BRONZE', 'PARTICIPATION');

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "branch" TEXT NOT NULL,
    "belt" TEXT NOT NULL,
    "registrationOrder" INTEGER,
    "testCompleted" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "parentPhone" TEXT,
    "kata1" TEXT,
    "kata2" TEXT,
    "kata3" TEXT,
    "extraData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SequenceOrder" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "branch" TEXT NOT NULL,
    "belt" TEXT NOT NULL,
    "sequenceNo" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SequenceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kata_scores" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "kata1Name" TEXT NOT NULL,
    "kata1Marks" DOUBLE PRECISION,
    "kata2Name" TEXT NOT NULL,
    "kata2Marks" DOUBLE PRECISION,
    "kata3Name" TEXT NOT NULL,
    "kata3Marks" DOUBLE PRECISION,
    "average" DOUBLE PRECISION,
    "medal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kata_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SequenceOrder_registrationId_key" ON "SequenceOrder"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "SequenceOrder_branch_belt_sequenceNo_key" ON "SequenceOrder"("branch", "belt", "sequenceNo");

-- CreateIndex
CREATE UNIQUE INDEX "kata_scores_registrationId_key" ON "kata_scores"("registrationId");

-- AddForeignKey
ALTER TABLE "SequenceOrder" ADD CONSTRAINT "SequenceOrder_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kata_scores" ADD CONSTRAINT "kata_scores_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
