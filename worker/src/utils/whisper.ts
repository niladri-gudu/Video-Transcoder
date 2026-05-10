import { spawn } from "child_process";

export async function generateSubtitles(audioPath: string) {
  return new Promise<void>((resolve, reject) => {
    const process = spawn(
      "D:/whisper/Release/whisper-cli.exe",
      [
        "-m",
        "D:/whisper/Release/models/ggml-base.en.bin",
        "-f",
        audioPath,
        "-ovtt",
      ]
    );

    process.stdout.on("data", (data) => {
      console.log(data.toString());
    });

    process.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("Whisper transcription failed"));

        return;
      }

      resolve();
    });
  });
}