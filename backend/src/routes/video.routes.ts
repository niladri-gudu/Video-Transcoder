import type { FastifyInstance } from "fastify";
import * as VideoController from "../controllers/video.controller";

export async function appRoutes(fastify: FastifyInstance) {
  // Video Content & Query Mapping
  fastify.get("/videos", VideoController.listVideos);
  fastify.get("/videos/:id", VideoController.getVideoStatus);
  fastify.post("/videos/:id/chat", VideoController.chatWithTranscript);

  // High-Volume Multipart Upload Orchestration
  fastify.post("/videos/multipart/initiate", VideoController.initiateMultipart);
  fastify.post("/videos/multipart/urls", VideoController.getMultipartUrls);
  fastify.post("/videos/multipart/complete", VideoController.completeMultipart);
}
