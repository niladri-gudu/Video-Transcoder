import fs from "fs";
import path from "path";

import { extractAudio } from "./extract-audio";
import { generateSubtitles } from "./whisper";
import { uploadToS3 } from "./upload";

import { prisma } from "../lib/prisma";

export async function generateCaptions(inputPath: string, videoId: string) {
  const audioPath = path.join("tmp", `${videoId}.mp3`);

  console.log("🎙️ Extracting audio...");

  await extractAudio(inputPath, audioPath);

  console.log("🧠 Running Whisper transcription...");

  await generateSubtitles(audioPath);

  const vttPath = `${audioPath}.vtt`;
  const transcriptPath = `${audioPath}.txt`;

  const captionsKey = `processed/captions/${videoId}.vtt`;
  const transcriptKey = `processed/transcripts/${videoId}.txt`;

  console.log("☁️ Uploading captions to S3...");

  await uploadToS3(vttPath, captionsKey);
  await uploadToS3(transcriptPath, transcriptKey);

  await prisma.video.update({
    where: { id: videoId },
    data: { captionsS3Key: captionsKey, transcriptS3Key: transcriptKey },
  });

  console.log("✅ Captions uploaded");

  if (fs.existsSync(audioPath)) {
    fs.unlinkSync(audioPath);
  }

  if (fs.existsSync(vttPath)) {
    fs.unlinkSync(vttPath);
  }

  if (fs.existsSync(transcriptPath)) {
    fs.unlinkSync(transcriptPath);
  }

  console.log("🧹 Caption temp cleanup done");
}
