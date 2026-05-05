import fs from "fs";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../lib/s3";

export const uploadToS3 = async (filePath: string, key: string) => {
  const fileContent = fs.createReadStream(filePath);

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: fileContent,
      ContentType: "video/mp4",
    }),
  );

  return key;
};
