import Fastify from "fastify";
import "dotenv/config";
import { prisma } from "./lib/prisma";
import { randomUUID } from "crypto";
import { generateUploadUrl } from "./lib/s3";
import { videoQueue } from "./queue/video.queue";
import { s3 } from "./lib/s3";
import { HeadObjectCommand } from "@aws-sdk/client-s3";
import cors from "@fastify/cors";
import {
  initiateMultipartUpload,
  getMultipartUploadUrls,
  completeMultipartUpload,
} from "./lib/s3-multipart";
import { Server } from "socket.io";
import { subscriber } from "./lib/pubsub";
import { getTranscript } from "./utils/transcript";
import { model } from "./lib/gemini";

const app = Fastify({
  logger: true,
});

app.register(cors);

const io = new Server(app.server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-video", (videoId: string) => {
    socket.join(videoId);

    console.log(`Client ${socket.id} joined video room: ${videoId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

await subscriber.subscribe("video-progress");

console.log("Subscribed to video-progress channel");

subscriber.on("message", (channel, message) => {
  if (channel !== "video-progress") return;

  const data = JSON.parse(message);

  console.log("Redis event", data);

  io.to(data.videoId).emit("video-progress", data);
});

const PORT = parseInt(process.env.PORT || "3000", 10);

app.get("/", function (request, reply) {
  reply.send("hello world");
});

app.post(
  "/users",
  {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
      },
    },
  },
  async (request, reply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    try {
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash: password,
        },
      });

      return user;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as { code?: string }).code === "P2002"
      ) {
        return reply.status(400).send({ error: "User already exists" });
      }

      return reply.status(500).send({ error: "Internal server error" });
    }
  },
);

app.get("/videos", async (request, reply) => {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      variants: true,
    },
  });

  return videos;
});

app.post("/videos/:id/chat", async (request, reply) => {
  const { id } = request.params as { id: string };

  const { message } = request.body as { message: string };

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video?.transcriptS3Key) {
    return reply.status(404).send({ error: "Transcript not found" });
  }

  const transcriptUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${video.transcriptS3Key}`;

  const transcript = await getTranscript(transcriptUrl);

  const prompt = `
    You are a helpful assistant that answers questions about the video based on the following transcript

    VIDEO TRANSCRIPT:
    ${transcript}

    USER QUESTION:
    ${message}

    Answer clearly and concisely.
    `;

  const result = await model.generateContent(prompt);

  const response = result.response.text();

  return { response: response };
});

app.get("/videos/:id", async (request, reply) => {
  const { id } = request.params as { id: string };

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video) {
    return reply.status(404).send({ error: "Video not found" });
  }

  return {
    id: video.id,
    status: video.status,
    title: video.title,
    captionsUrl: video.captionsS3Key
      ? `https://${process.env.AWS_BUCKET_NAME}.s3.ap-south-1.amazonaws.com/${video.captionsS3Key}`
      : null,
  };
});

app.post(
  "/videos/initiate-upload",
  {
    schema: {
      body: {
        type: "object",
        required: ["title", "fileName", "mimeType"],
        properties: {
          title: { type: "string" },
          fileName: { type: "string" },
          mimeType: { type: "string" },
        },
      },
    },
  },
  async (request, reply) => {
    const { title, fileName, mimeType } = request.body as {
      title: string;
      fileName: string;
      mimeType: string;
    };

    const allowedTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-matroska",
      "video/webm",
    ];

    if (!allowedTypes.includes(mimeType)) {
      return reply.status(400).send({
        error: "Unsupported video format",
      });
    }

    const ext = fileName.split(".").pop();

    const videoId = randomUUID();

    const s3Key = `raw/${videoId}.${ext}`;

    await prisma.video.create({
      data: {
        id: videoId,
        title,
        rawS3key: s3Key,
        status: "pending",
        userId: "39ceb110-445c-4ee9-a57f-066a8d63d6c7",
      },
    });

    const uploadUrl = await generateUploadUrl(s3Key);

    return {
      videoId,
      uploadUrl,
    };
  },
);

app.post("/videos/:id/confirm-upload", async (request, reply) => {
  const { id } = request.params as { id: string };

  const video = await prisma.video.findUnique({ where: { id } });

  if (!video) {
    return reply.status(404).send({ error: "Video not found" });
  }

  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: video.rawS3key,
      }),
    );
  } catch (error) {
    return reply.status(400).send({ error: "File not uploaded yet" });
  }

  await videoQueue.add(
    "transcode",
    {
      videoId: video.id,
      s3Key: video.rawS3key,
    },
    {
      jobId: video.id,
    },
  );

  return reply.send({ success: true });
});

app.post("/videos/multipart/initiate", async (request, reply) => {
  const { fileName } = request.body as { fileName: string };

  console.log("Initiating multipart upload for file:", fileName);

  const title = fileName.replace(/\.[^/.]+$/, "");

  const videoId = randomUUID();
  const ext = fileName.split(".").pop();

  const key = `raw/${videoId}.${ext}`;

  await prisma.video.create({
    data: {
      id: videoId,
      title: title,
      rawS3key: key,
      status: "pending",
      userId: "39ceb110-445c-4ee9-a57f-066a8d63d6c7",
    },
  });

  const { uploadId } = await initiateMultipartUpload(key);

  return { videoId, uploadId, key };
});

app.post("/videos/multipart/urls", async (request, reply) => {
  const { key, uploadId, partCount } = request.body as {
    key: string;
    uploadId: string;
    partCount: number;
  };

  const urls = await getMultipartUploadUrls(key, uploadId, partCount);

  return { urls };
});

app.post("/videos/multipart/complete", async (request, reply) => {
  const { key, uploadId, parts, videoId } = request.body as {
    key: string;
    uploadId: string;
    videoId: string;
    parts: { ETag: string; PartNumber: number }[];
  };

  await completeMultipartUpload(key, uploadId, parts);

  await videoQueue.add(
    "transcode",
    {
      videoId,
      s3Key: key,
    },
    {
      jobId: `${videoId}-transcode`,
    },
  );

  return { success: true };
});

const start = async () => {
  try {
    await app.listen({
      port: PORT,
    });

    console.log(`🚀 Server running on port ${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();
