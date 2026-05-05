import { exec } from "child_process";

export const runFFmpeg = (command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      console.log("FFmpeg stdout:", stdout);
      console.log("FFmpeg stderr:", stderr);

      if (error) {
        console.error("FFmpeg error:", error);
        return reject({ error, stdout, stderr });
      }

      resolve(stdout);
    });
  });
};
