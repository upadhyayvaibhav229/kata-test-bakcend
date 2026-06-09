/*
  Warnings:

  - The values [DRAFT] on the enum `FormStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `category` on the `evaluation_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `endedAt` on the `evaluation_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `formId` on the `evaluation_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `evaluation_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `round` on the `evaluation_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `evaluation_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `evaluation_sessions` table. All the data in the column will be lost.
  - You are about to drop the column `athleticScore` on the `kata_scores` table. All the data in the column will be lost.
  - You are about to drop the column `judgeNotes` on the `kata_scores` table. All the data in the column will be lost.
  - You are about to drop the column `penaltyPoints` on the `kata_scores` table. All the data in the column will be lost.
  - You are about to drop the column `rank` on the `kata_scores` table. All the data in the column will be lost.
  - You are about to drop the column `technicalScore` on the `kata_scores` table. All the data in the column will be lost.
  - You are about to drop the column `timingScore` on the `kata_scores` table. All the data in the column will be lost.
  - You are about to drop the column `totalScore` on the `kata_scores` table. All the data in the column will be lost.
  - You are about to drop the column `ageCategory` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `coachName` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `contactNumber` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `dojo` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `kataCategory` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `weightClass` on the `registrations` table. All the data in the column will be lost.
  - You are about to drop the column `deadline` on the `tournament_forms` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `tournament_forms` table. All the data in the column will be lost.
  - You are about to drop the column `eventDate` on the `tournament_forms` table. All the data in the column will be lost.
  - You are about to drop the column `maxSlots` on the `tournament_forms` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `tournament_forms` table. All the data in the column will be lost.
  - You are about to drop the column `venue` on the `tournament_forms` table. All the data in the column will be lost.
  - Added the required column `belt` to the `evaluation_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branch` to the `evaluation_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sequence` to the `evaluation_sessions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kataName` to the `kata_scores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `age` to the `registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `branch` to the `registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kata1` to the `registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kata2` to the `registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kata3` to the `registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `parentPhone` to the `registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `registrations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `endDate` to the `tournament_forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `tournament_forms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `tournament_forms` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Medal" AS ENUM ('GOLD', 'SILVER', 'BRONZE', 'PARTICIPATION');

-- AlterEnum
BEGIN;
CREATE TYPE "FormStatus_new" AS ENUM ('OPEN', 'CLOSED');
ALTER TABLE "tournament_forms" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "tournament_forms" ALTER COLUMN "status" TYPE "FormStatus_new" USING ("status"::text::"FormStatus_new");
ALTER TYPE "FormStatus" RENAME TO "FormStatus_old";
ALTER TYPE "FormStatus_new" RENAME TO "FormStatus";
DROP TYPE "FormStatus_old";
ALTER TABLE "tournament_forms" ALTER COLUMN "status" SET DEFAULT 'OPEN';
COMMIT;

-- DropForeignKey
ALTER TABLE "evaluation_sessions" DROP CONSTRAINT "evaluation_sessions_formId_fkey";

-- DropIndex
DROP INDEX "kata_scores_sessionId_registrationId_key";

-- AlterTable
ALTER TABLE "evaluation_sessions" DROP COLUMN "category",
DROP COLUMN "endedAt",
DROP COLUMN "formId",
DROP COLUMN "name",
DROP COLUMN "round",
DROP COLUMN "startedAt",
DROP COLUMN "status",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "belt" TEXT NOT NULL,
ADD COLUMN     "branch" TEXT NOT NULL,
ADD COLUMN     "sequence" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "kata_scores" DROP COLUMN "athleticScore",
DROP COLUMN "judgeNotes",
DROP COLUMN "penaltyPoints",
DROP COLUMN "rank",
DROP COLUMN "technicalScore",
DROP COLUMN "timingScore",
DROP COLUMN "totalScore",
ADD COLUMN     "kataName" TEXT NOT NULL,
ADD COLUMN     "marks" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "registrations" DROP COLUMN "ageCategory",
DROP COLUMN "coachName",
DROP COLUMN "contactNumber",
DROP COLUMN "dateOfBirth",
DROP COLUMN "dojo",
DROP COLUMN "email",
DROP COLUMN "gender",
DROP COLUMN "kataCategory",
DROP COLUMN "status",
DROP COLUMN "weightClass",
ADD COLUMN     "age" INTEGER NOT NULL,
ADD COLUMN     "branch" TEXT NOT NULL,
ADD COLUMN     "kata1" TEXT NOT NULL,
ADD COLUMN     "kata2" TEXT NOT NULL,
ADD COLUMN     "kata3" TEXT NOT NULL,
ADD COLUMN     "parentPhone" TEXT NOT NULL,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "tournament_forms" DROP COLUMN "deadline",
DROP COLUMN "description",
DROP COLUMN "eventDate",
DROP COLUMN "maxSlots",
DROP COLUMN "title",
DROP COLUMN "venue",
ADD COLUMN     "endDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'OPEN';

-- DropEnum
DROP TYPE "Gender";

-- DropEnum
DROP TYPE "RegistrationStatus";

-- DropEnum
DROP TYPE "SessionStatus";

-- CreateIndex
CREATE INDEX "evaluation_sessions_branch_belt_idx" ON "evaluation_sessions"("branch", "belt");

-- CreateIndex
CREATE INDEX "kata_scores_sessionId_idx" ON "kata_scores"("sessionId");

-- CreateIndex
CREATE INDEX "kata_scores_registrationId_idx" ON "kata_scores"("registrationId");

-- CreateIndex
CREATE INDEX "registrations_branch_idx" ON "registrations"("branch");

-- CreateIndex
CREATE INDEX "registrations_belt_idx" ON "registrations"("belt");

-- CreateIndex
CREATE INDEX "registrations_formId_idx" ON "registrations"("formId");
