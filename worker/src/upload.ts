import fs from "fs";
import axios from "axios";

const filePath = "./myvideo.mp4";

const urls = [
  {
    partNumber: 1,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/a13c13e4-0064-4fa7-ac17-2ecd67ae9469.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T133549Z&X-Amz-Expires=3600&X-Amz-Signature=fa071b19f34b39ec78b750a35f6eb3d0d366bbee0737e8601511cc5a2f53376e&X-Amz-SignedHeaders=host&partNumber=1&uploadId=67Bqrdj6dp5L_CC0j_5iQd3KYxHFOwzBLsgRY5hwogd1t64AslT5TwsivGRG7ieFxIZIAYBGukg9zsIoIhA6UYiUKtnLbs9Gt2MIsAtuX3_.TLYe_wVwpX1poo2pyZbe&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 2,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/a13c13e4-0064-4fa7-ac17-2ecd67ae9469.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T133549Z&X-Amz-Expires=3600&X-Amz-Signature=9ed89456c9b3c494382fe7b81611f9937426d048043254ddad5d73d9e5ea976d&X-Amz-SignedHeaders=host&partNumber=2&uploadId=67Bqrdj6dp5L_CC0j_5iQd3KYxHFOwzBLsgRY5hwogd1t64AslT5TwsivGRG7ieFxIZIAYBGukg9zsIoIhA6UYiUKtnLbs9Gt2MIsAtuX3_.TLYe_wVwpX1poo2pyZbe&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 3,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/a13c13e4-0064-4fa7-ac17-2ecd67ae9469.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T133549Z&X-Amz-Expires=3600&X-Amz-Signature=637f88af181ebe310c98cbd831d53b4a1627721cdd011757a3d0ec2d22a5b896&X-Amz-SignedHeaders=host&partNumber=3&uploadId=67Bqrdj6dp5L_CC0j_5iQd3KYxHFOwzBLsgRY5hwogd1t64AslT5TwsivGRG7ieFxIZIAYBGukg9zsIoIhA6UYiUKtnLbs9Gt2MIsAtuX3_.TLYe_wVwpX1poo2pyZbe&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
];

const fileSize = fs.statSync(filePath).size;
const partCount = urls.length;
const chunkSize = Math.ceil(fileSize / partCount);

console.log("File size:", fileSize);
console.log("Parts:", partCount);
console.log("Chunk size:", chunkSize);

const file = fs.readFileSync(filePath);

const uploadedParts = [];

for (let i = 0; i < partCount; i++) {
  const start = i * chunkSize;
  const end = Math.min(start + chunkSize, file.length);

  const chunk = file.slice(start, end);

  const urlObj = urls[i];
  if (!urlObj) continue;
  const { url, partNumber } = urlObj;

  console.log(`⬆️ Uploading part ${partNumber}...`);

  const res = await axios.put(url, chunk, {
    headers: {
      "Content-Type": "application/octet-stream",
    },
    maxBodyLength: Infinity,
  });

  const etag = res.headers.etag;

  console.log(`✅ Part ${partNumber} uploaded | ETag: ${etag}`);

  uploadedParts.push({
    ETag: etag.replaceAll('"', ""),
    PartNumber: partNumber,
  });
}

console.log("\n🎉 ALL PARTS UPLOADED\n");

console.log("COPY THIS INTO /complete API:\n");
console.log(JSON.stringify(uploadedParts, null, 2));
