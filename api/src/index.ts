import Fastify from "fastify";
import "dotenv/config";
import { prisma } from "./lib/prisma";
import { randomUUID } from "crypto";
import { generateUploadUrl } from "./lib/s3";
import { videoQueue } from "./queue/video.queue";

const app = Fastify({
  logger: true,
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

app.post(
  "/videos/initiate-upload",
  {
    schema: {
      body: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string" },
        },
      },
    },
  },
  async (request, reply) => {
    const { title } = request.body as { title: string };

    const videoId = randomUUID();

    const s3key = `raw/${videoId}.mp4`;

    const video = await prisma.video.create({
      data: {
        id: videoId,
        title,
        rawS3key: s3key,
        status: "pending",
        userId: "39ceb110-445c-4ee9-a57f-066a8d63d6c7",
      },
    });

    const uploadUrl = await generateUploadUrl(s3key);

    const job = await videoQueue.add("transcode", {
      videoId,
      s3key,
    });

    console.log("Job added:", job.id);

    return {
      videoId,
      uploadUrl,
    };
  },
);

const start = async () => {
  try {
    await app.listen({ port: PORT });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
  console.log(`Server is running on port ${PORT}`);
};

start();
