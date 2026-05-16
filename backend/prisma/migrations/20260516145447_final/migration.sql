/*
  Warnings:

  - You are about to drop the column `duration` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `failureReason` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `filesize` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `processingStartedAt` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Video` table. All the data in the column will be lost.
  - You are about to drop the column `bitrate` on the `VideoVariant` table. All the data in the column will be lost.
  - You are about to drop the column `codec` on the `VideoVariant` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `VideoVariant` table. All the data in the column will be lost.
  - You are about to drop the `TranscodingJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TranscodingJob" DROP CONSTRAINT "TranscodingJob_videoId_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_userId_fkey";

-- DropForeignKey
ALTER TABLE "VideoVariant" DROP CONSTRAINT "VideoVariant_videoId_fkey";

-- DropIndex
DROP INDEX "Video_userId_idx";

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "duration",
DROP COLUMN "failureReason",
DROP COLUMN "filesize",
DROP COLUMN "processingStartedAt",
DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "VideoVariant" DROP COLUMN "bitrate",
DROP COLUMN "codec",
DROP COLUMN "fileSize";

-- DropTable
DROP TABLE "TranscodingJob";

-- DropTable
DROP TABLE "User";

-- AddForeignKey
ALTER TABLE "VideoVariant" ADD CONSTRAINT "VideoVariant_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
