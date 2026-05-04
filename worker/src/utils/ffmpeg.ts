import { exec } from "child_process";

export const runFFmpeg = (command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing FFmpeg command: ${error.message}`);
        return reject(error);
      }
      resolve;
    });
  });
};
