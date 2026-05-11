/*
  Warnings:

  - You are about to drop the column `transcript` on the `Video` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "transcript",
ADD COLUMN     "transcriptS3Key" TEXT;
