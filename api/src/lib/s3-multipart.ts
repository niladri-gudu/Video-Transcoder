import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3 } from "./s3";

export const initiateMultipartUpload = async (key: string) => {
  const command = new CreateMultipartUploadCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    ContentType: "video/mp4",
  });

  const response = await s3.send(command);

  return {
    uploadId: response.UploadId!,
    key,
  };
};

export const getMultipartUploadUrls = async (
  key: string,
  uploadId: string,
  partCount: number
) => {
  const urls = [];

  for (let i = 1; i <= partCount; i++) {
    const command = new UploadPartCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      UploadId: uploadId,
      PartNumber: i,
    });

    const url = await getSignedUrl(s3, command, {
      expiresIn: 3600,
    });

    urls.push({ partNumber: i, url });
  }

  return urls;
};

export const completeMultipartUpload = async (
  key: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[]
) => {
  const command = new CompleteMultipartUploadCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    UploadId: uploadId,
    MultipartUpload: {
      Parts: parts,
    },
  });

  return await s3.send(command);
};