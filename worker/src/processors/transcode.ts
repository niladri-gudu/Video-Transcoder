import path from "path";
import fs from "fs";
import { runFFmpeg } from "../utils/ffmpeg";
import { downloadFromS3 } from "../utils/download";
import { uploadToS3 } from "../utils/upload";
import { prisma } from "../lib/prisma";

const RESOLUTIONS = [
  { label: "480p", height: 480, bandwidth: 800000, resolution: "854x480" },
  { label: "720p", height: 720, bandwidth: 1400000, resolution: "1280x720" },
  { label: "1080p", height: 1080, bandwidth: 2800000, resolution: "1920x1080" },
];

export const transcodeProcessor = async (job: any) => {
  const { videoId, s3Key } = job.data;

  console.log("🔥 Processing:", videoId);

  const inputPath = path.join("tmp", `${videoId}.mp4`);
  const hlsDir = path.join("tmp", videoId);

  if (!fs.existsSync("tmp")) fs.mkdirSync("tmp");
  if (!fs.existsSync(hlsDir)) fs.mkdirSync(hlsDir, { recursive: true });

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

    for (const res of RESOLUTIONS) {
      const playlistPath = path.join(hlsDir, `${res.label}.m3u8`);
      const segmentPattern = path.join(hlsDir, `${res.label}_%03d.ts`);

      console.log(`🎬 Generating HLS ${res.label}...`);

      await runFFmpeg(
        `ffmpeg -i "${inputPath}" \
          -vf scale=-2:${res.height} \
          -c:v libx264 -c:a aac \
          -preset fast -crf 23 \
          -hls_time 6 \
          -hls_playlist_type vod \
          -hls_segment_filename "${segmentPattern}" \
          "${playlistPath}"`,
      );

      console.log(`✅ HLS ${res.label} done`);

      const playlistKey = `processed/hls/${videoId}/${res.label}.m3u8`;
      await uploadToS3(playlistPath, playlistKey);

      const files = fs.readdirSync(hlsDir);

      for (const file of files) {
        if (file.startsWith(res.label) && file.endsWith(".ts")) {
          const filePath = path.join(hlsDir, file);
          const key = `processed/hls/${videoId}/${file}`;

          await uploadToS3(filePath, key);
        }
      }

      console.log(`📤 Uploaded HLS ${res.label}`);

      await prisma.videoVariant.upsert({
        where: {
          videoId_resolution: {
            videoId,
            resolution: res.label,
          },
        },
        update: {
          s3Key: playlistKey,
        },
        create: {
          videoId,
          resolution: res.label,
          s3Key: playlistKey,
        },
      });
    }

    const masterPath = path.join(hlsDir, "master.m3u8");

    const masterContent =
      "#EXTM3U\n" +
      RESOLUTIONS.map(
        (r) =>
          `#EXT-X-STREAM-INF:BANDWIDTH=${r.bandwidth},RESOLUTION=${r.resolution}\n${r.label}.m3u8`,
      ).join("\n");

    fs.writeFileSync(masterPath, masterContent);

    await uploadToS3(masterPath, `processed/hls/${videoId}/master.m3u8`);

    console.log("📤 Uploaded master playlist");

    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
      console.log("🧹 Deleted original file");
    }

    fs.rmSync(hlsDir, { recursive: true, force: true });
    console.log("🧹 Deleted HLS temp directory");

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
