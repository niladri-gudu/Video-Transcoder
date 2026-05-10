import { runFFmpeg } from "./ffmpeg";

export async function extractAudio(inputPath: string, outputPath: string) {
  await runFFmpeg(
    `ffmpeg -i "${inputPath}" \
      -vn \
      -acodec mp3 \
      -ar 44100 \
      -ac 2 \
      -b:a 192k \
      "${outputPath}"`,
  );
}
