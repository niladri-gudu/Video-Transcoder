import { Server as HttpServer } from "http";
import { Server } from "socket.io";

let ioInstance: Server | null = null;

export function initSocketServer(httpServer: HttpServer): Server {
  ioInstance = new Server(httpServer, {
    cors: { origin: "*" },
  });

  ioInstance.on("connection", (socket) => {
    console.log(`⚡ Client connected to WS: ${socket.id}`);

    socket.on("join-video", (videoId: string) => {
      socket.join(videoId);
      console.log(`👥 Client ${socket.id} joined video room: ${videoId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
}

export function getSocketIO(): Server {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized. Call initSocketServer first.");
  }
  return ioInstance;
}