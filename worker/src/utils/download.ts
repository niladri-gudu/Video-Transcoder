import fs from "fs";
import path from "path";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3";

export const downloadFromS3 = async (key: string, outputPath: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  const response = await s3.send(command);

  const stream = response.Body as any;

  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(outputPath);

    stream.pipe(fileStream).on("error", reject).on("close", resolve);
  });
};
