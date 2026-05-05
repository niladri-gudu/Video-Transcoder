import { exec } from "child_process";

export const runFFmpeg = (command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        return reject({ error, stdout, stderr });
      }

      resolve(stdout);
    });
  });
};
