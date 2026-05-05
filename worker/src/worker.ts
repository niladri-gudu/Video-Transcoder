import { Worker } from "bullmq";
import { connection } from "./lib/redis";
import { transcodeProcessor } from "./processors/transcode";

export const worker = new Worker("transcode", transcodeProcessor, {
  connection,
});

worker.on("completed", (job) => {
  console.log(`🎉 Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed`, err);
});