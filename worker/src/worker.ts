import { Worker } from "bullmq";
import Redis from "ioredis";
import "dotenv/config";
import path from "path";
import fs from "fs";
import { runFFmpeg } from "./utils/ffmpeg";
import { downloadFromS3 } from "./utils/download";

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT!, 10),
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "video-processing",
  async (job) => {
    const { videoId, s3Key } = job.data;

    console.log("🔥 Processing:", videoId);

    const inputPath = path.join("tmp", `${videoId}.mp4`);
    const output480pPath = path.join("tmp", `${videoId}-480p.mp4`);

    if (!fs.existsSync("tmp")) fs.mkdirSync("tmp");

    await downloadFromS3(s3Key, inputPath);
    console.log("⬇️ Downloaded");

    await runFFmpeg(
      `ffmpeg -i ${inputPath} -vf scale=-2:480 -c:v libx264 -preset fast -crf 23 ${output480pPath}`,
    );

    console.log("🎬 480p done");

    return { success: true };
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed`, err);
});
