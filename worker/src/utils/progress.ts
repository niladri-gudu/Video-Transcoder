import { publisher } from "../lib/pubsub";

export async function emitVideoProgress(
  videoId: string,
  progress: number,
  step: string,
) {
  await publisher.publish(
    "video-progress",
    JSON.stringify({ videoId, progress, step }),
  );
}
