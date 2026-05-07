import { runFFmpeg } from "../utils/ffmpeg";
import { uploadToS3 } from "../utils/upload";
import { prisma } from "../lib/prisma";

export async function generateThumbnail(
  inputPath: string,
  thumbnailPath: string,
  videoId: string,
) {
  console.log(`Generating thumbnail for video ${videoId}...`);

  await runFFmpeg(
    `ffmpeg -ss 00:00:03 -i "${inputPath}" \
      -frames:v 1 \
      -vf "scale=1280:-1" \
      "${thumbnailPath}"`,
  );

  console.log(`Finished generating thumbnail for video ${videoId}`);

  const thumbnailKey = `processed/thumbnails/${videoId}.jpg`;

  await uploadToS3(thumbnailPath, thumbnailKey);

  console.log(`Thumbnail uploaded to S3 for video ${videoId}`);

  await prisma.video.update({
    where: { id: videoId },
    data: {
      thumbnailS3key: thumbnailKey,
    },
  });

  console.log(`Database updated with thumbnail S3 key for video ${videoId}`);
}
