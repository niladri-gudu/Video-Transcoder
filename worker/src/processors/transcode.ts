import path from "path";
import fs from "fs";
import { runFFmpeg } from "../utils/ffmpeg";
import { downloadFromS3 } from "../utils/download";
import { uploadToS3 } from "../utils/upload";
import { prisma } from "../lib/prisma";

export const transcodeProcessor = async (job: any) => {
  const { videoId, s3Key } = job.data;

  console.log("🔥 Processing:", videoId);

  const inputPath = path.join("tmp", `${videoId}.mp4`);
  const output480pPath = path.join("tmp", `${videoId}-480p.mp4`);

  if (!fs.existsSync("tmp")) fs.mkdirSync("tmp");

  try {
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "processing" },
    });

    await downloadFromS3(s3Key, inputPath);
    console.log("⬇️ Downloaded");

    console.log("🔍 Validating input file...");

    let isValidVideo = false;

    try {
      await runFFmpeg(`ffmpeg -i "${inputPath}"`);
    } catch (err: any) {
      const stderr = err?.stderr || "";

      console.log("Validation stderr:", stderr);

      if (stderr.includes("Video:")) {
        isValidVideo = true;
      }
    }

    if (!isValidVideo) {
      throw new Error("Invalid video file (no video stream)");
    }

    console.log("✅ File validation passed");

    await runFFmpeg(
      `ffmpeg -i "${inputPath}" -vf scale=-2:480 -c:v libx264 -preset fast -crf 23 "${output480pPath}"`,
    );

    console.log("🎬 480p done");

    const processedKey = `processed/480p/${videoId}.mp4`;

    await uploadToS3(output480pPath, processedKey);
    console.log("⬆️ Uploaded to S3");

    await prisma.videoVariant.create({
      data: {
        videoId,
        resolution: "480p",
        s3Key: processedKey,
      },
    });

    await prisma.video.update({
      where: { id: videoId },
      data: { status: "completed" },
    });

    return { success: true };
  } catch (error) {
    console.error("❌ Processing failed:", error);

    await prisma.video.update({
      where: { id: videoId },
      data: { status: "failed" },
    });

    throw error;
  }
};
