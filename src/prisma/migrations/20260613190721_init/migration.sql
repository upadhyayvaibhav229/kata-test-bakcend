/*
  Warnings:

  - You are about to drop the column `kataName` on the `kata_scores` table. All the data in the column will be lost.
  - You are about to drop the column `marks` on the `kata_scores` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `kata_scores` table. All the data in the column will be lost.
  - You are about to drop the column `formId` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `registeredAt` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the `evaluation_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tournament_forms` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[registrationId]` on the table `kata_scores` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kata1Name` to the `kata_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kata2Name` to the `kata_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kata3Name` to the `kata_scores` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "kata_scores" DROP CONSTRAINT "kata_scores_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "registrations" DROP CONSTRAINT "registrations_formId_fkey";

-- DropIndex
DROP INDEX "kata_scores_registrationId_idx";

-- DropIndex
DROP INDEX "kata_scores_sessionId_idx";

-- DropIndex
DROP INDEX "registrations_belt_idx";

-- DropIndex
DROP INDEX "registrations_branch_idx";

-- DropIndex
DROP INDEX "registrations_formId_idx";

-- AlterTable
ALTER TABLE "kata_scores" DROP COLUMN "kataName",
DROP COLUMN "marks",
DROP COLUMN "sessionId",
ADD COLUMN     "average" DOUBLE PRECISION,
ADD COLUMN     "kata1Marks" DOUBLE PRECISION,
ADD COLUMN     "kata1Name" TEXT NOT NULL,
ADD COLUMN     "kata2Marks" DOUBLE PRECISION,
ADD COLUMN     "kata2Name" TEXT NOT NULL,
ADD COLUMN     "kata3Marks" DOUBLE PRECISION,
ADD COLUMN     "kata3Name" TEXT NOT NULL,
ADD COLUMN     "medal" TEXT,
ADD COLUMN     "percentage" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "registrations" DROP COLUMN "formId",
DROP COLUMN "registeredAt",
ADD COLUMN     "extraData" JSONB,
ADD COLUMN     "registrationOrder" INTEGER,
ADD COLUMN     "testCompleted" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "kata1" DROP NOT NULL,
ALTER COLUMN "kata2" DROP NOT NULL,
ALTER COLUMN "kata3" DROP NOT NULL,
ALTER COLUMN "parentPhone" DROP NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL;

-- DropTable
DROP TABLE "evaluation_sessions";

-- DropTable
DROP TABLE "tournament_forms";

-- DropEnum
DROP TYPE "FormStatus";

-- CreateIndex
CREATE UNIQUE INDEX "kata_scores_registrationId_key" ON "kata_scores"("registrationId");
