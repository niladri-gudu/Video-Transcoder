import path from "path";
import fs from "fs";
import { runFFmpeg } from "../utils/ffmpeg";
import { downloadFromS3 } from "../utils/download";
import { uploadToS3 } from "../utils/upload";
import { prisma } from "../lib/prisma";

const RESOLUTIONS = [
  { label: "480p", height: 480 },
  { label: "720p", height: 720 },
  { label: "1080p", height: 1080 },
];

export const transcodeProcessor = async (job: any) => {
  const { videoId, s3Key } = job.data;

  console.log("🔥 Processing:", videoId);

  const inputPath = path.join("tmp", `${videoId}.mp4`);

  if (!fs.existsSync("tmp")) fs.mkdirSync("tmp");

  try {
    const video = await prisma.video.findUnique({ where: { id: videoId } });

    if (video?.status === "completed") {
      console.log("✅ Already processed:", videoId);
      return;
    }

    await prisma.video.update({
      where: { id: videoId },
      data: { status: "processing" },
    });

    await downloadFromS3(s3Key, inputPath);
    console.log("📥 Downloaded from S3:", s3Key);

    console.log("🔍 Validating input file...");
    let isValidVideo = false;

    try {
      await runFFmpeg(`ffmpeg -i "${inputPath}"`);
    } catch (err: any) {
      const stderr = err?.stderr || "";
      if (stderr.includes("Video:")) {
        isValidVideo = true;
      }
    }

    if (!isValidVideo) {
      throw new Error("Invalid video file");
    }

    console.log("✅ File validation passed");

    await Promise.all(
      RESOLUTIONS.map(async (res) => {
        const outputPath = path.join("tmp", `${videoId}_${res.label}.mp4`);

        console.log(`🎬 Transcoding to ${res.label}...`);

        await runFFmpeg(
          `ffmpeg -i "${inputPath}" -vf scale=-2:${res.height} -c:v libx264 -preset fast -crf 23 "${outputPath}"`,
        );

        console.log(`✅ ${res.label} done`);

        const processedKey = `processed/${res.label}/${videoId}.mp4`;

        await uploadToS3(outputPath, processedKey);
        console.log(`📤 Uploaded ${res.label}`);

        await prisma.videoVariant.upsert({
          where: {
            videoId_resolution: {
              videoId,
              resolution: res.label,
            },
          },
          update: {
            s3Key: processedKey,
          },
          create: {
            videoId,
            resolution: res.label,
            s3Key: processedKey,
          },
        });

        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
          console.log(`🧹 Deleted ${res.label} temp file`);
        }
      }),
    );

    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
      console.log("🧹 Deleted original file");
    }

    await prisma.video.update({
      where: { id: videoId },
      data: { status: "completed" },
    });

    console.log("🎉 Job completed");

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
