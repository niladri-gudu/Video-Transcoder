import { subscriber } from "../lib/pubsub";
import { getSocketIO } from "../lib/socket";

export async function startEventSubscriber() {
  await subscriber.subscribe("video-progress");
  console.log("📡 Background worker subscribed to video-progress channel");

  subscriber.on("message", (channel, message) => {
    if (channel !== "video-progress") return;

    const data = JSON.parse(message);
    console.log("📥 Redis Pub/Sub Event Received:", data);

    try {
      const io = getSocketIO();
      io.to(data.videoId).emit("video-progress", data);
    } catch (error) {
      console.error("❌ Failed to broadcast socket event:", error);
    }
  });
}
