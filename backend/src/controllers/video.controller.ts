import type { FastifyRequest, FastifyReply } from "fastify";
import { randomUUID } from "crypto";
import { prisma } from "../lib/prisma";
import { videoQueue } from "../queue/video.queue";
import { model } from "../lib/gemini";
import { getTranscript } from "../utils/transcript";
import {
  initiateMultipartUpload,
  getMultipartUploadUrls,
  completeMultipartUpload,
} from "../lib/s3-multipart";

// Mock constant until robust middleware/JWT state is applied
const HARDCODED_USER_ID = "39ceb110-445c-4ee9-a57f-066a8d63d6c7";

export async function listVideos(request: FastifyRequest, reply: FastifyReply) {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    include: { variants: true },
  });
  return videos;
}

export async function getVideoStatus(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const video = await prisma.video.findUnique({ where: { id } });

  if (!video) return reply.status(404).send({ error: "Video not found" });

  return {
    id: video.id,
    status: video.status,
    title: video.title,
    captionsUrl: video.captionsS3Key
      ? `https://${process.env.AWS_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${video.captionsS3Key}`
      : null,
  };
}

export async function chatWithTranscript(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const { message } = request.body as { message: string };

  const video = await prisma.video.findUnique({ where: { id } });
  if (!video?.transcriptS3Key) {
    return reply
      .status(404)
      .send({ error: "Transcript not available for parsing" });
  }

  const transcriptUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${video.transcriptS3Key}`;
  const transcript = await getTranscript(transcriptUrl);

  const prompt = `
    You are a helpful assistant that answers questions about the video based on the following transcript.
    VIDEO TRANSCRIPT:
    ${transcript}
    USER QUESTION:
    ${message}
    Answer clearly and concisely.
  `;

  const result = await model.generateContent(prompt);
  return { response: result.response.text() };
}

export async function initiateMultipart(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { fileName } = request.body as { fileName: string };
  const title = fileName.replace(/\.[^/.]+$/, "");
  const videoId = randomUUID();
  const ext = fileName.split(".").pop();
  const key = `raw/${videoId}.${ext}`;

  await prisma.video.create({
    data: {
      id: videoId,
      title,
      rawS3key: key,
      status: "pending",
      userId: HARDCODED_USER_ID,
    },
  });

  const { uploadId } = await initiateMultipartUpload(key);
  return { videoId, uploadId, key };
}

export async function getMultipartUrls(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { key, uploadId, partCount } = request.body as {
    key: string;
    uploadId: string;
    partCount: number;
  };
  const urls = await getMultipartUploadUrls(key, uploadId, partCount);
  return { urls };
}

export async function completeMultipart(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { key, uploadId, parts, videoId } = request.body as {
    key: string;
    uploadId: string;
    videoId: string;
    parts: { ETag: string; PartNumber: number }[];
  };

  await completeMultipartUpload(key, uploadId, parts);
  await videoQueue.add(
    "transcode",
    { videoId, s3Key: key },
    { jobId: `${videoId}-transcode` },
  );
  return { success: true };
}
