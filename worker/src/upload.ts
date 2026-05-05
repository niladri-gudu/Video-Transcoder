import fs from "fs";
import axios from "axios";

const filePath = "./myvideo.mp4";

const urls = [
  {
    partNumber: 1,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/19f69334-2345-458d-b212-b0c10b287584.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T115112Z&X-Amz-Expires=3600&X-Amz-Signature=19eca99547cb4edb854ec66826c7e624c736bdb07d34c52ae9445fde8d2d0535&X-Amz-SignedHeaders=host&partNumber=1&uploadId=nG4GEyxzFBXOPQ7nVKAPpKAimOCn9s06JvknRvVuqhDmVwBNogCrZCqSK07_K3xcj5As6817yW5Z_lLMcoWzr9dRUh7ZeSMZNgegDhook3Eii8Fz6rRw5KY.AQT7tWWJ&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 2,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/19f69334-2345-458d-b212-b0c10b287584.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T115112Z&X-Amz-Expires=3600&X-Amz-Signature=d0b3e4b5964eb9e066a1a6a635eefa2523c5ed4be9f4f5795ded6e5feb5b624f&X-Amz-SignedHeaders=host&partNumber=2&uploadId=nG4GEyxzFBXOPQ7nVKAPpKAimOCn9s06JvknRvVuqhDmVwBNogCrZCqSK07_K3xcj5As6817yW5Z_lLMcoWzr9dRUh7ZeSMZNgegDhook3Eii8Fz6rRw5KY.AQT7tWWJ&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 3,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/19f69334-2345-458d-b212-b0c10b287584.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T115112Z&X-Amz-Expires=3600&X-Amz-Signature=8daee816b9d8ae2222750f7d866ecfa59f563a5f68ca1a850ad4f83c6f6882cf&X-Amz-SignedHeaders=host&partNumber=3&uploadId=nG4GEyxzFBXOPQ7nVKAPpKAimOCn9s06JvknRvVuqhDmVwBNogCrZCqSK07_K3xcj5As6817yW5Z_lLMcoWzr9dRUh7ZeSMZNgegDhook3Eii8Fz6rRw5KY.AQT7tWWJ&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 4,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/19f69334-2345-458d-b212-b0c10b287584.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T115112Z&X-Amz-Expires=3600&X-Amz-Signature=5b6734a5ff9685768d2f01c01df83744ebdf91bdc68fb32ecd0dfa9379f3b4dc&X-Amz-SignedHeaders=host&partNumber=4&uploadId=nG4GEyxzFBXOPQ7nVKAPpKAimOCn9s06JvknRvVuqhDmVwBNogCrZCqSK07_K3xcj5As6817yW5Z_lLMcoWzr9dRUh7ZeSMZNgegDhook3Eii8Fz6rRw5KY.AQT7tWWJ&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 5,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/19f69334-2345-458d-b212-b0c10b287584.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T115112Z&X-Amz-Expires=3600&X-Amz-Signature=58523fbd7a5dfdfd0dc3dd131e778681ced7b83d993f91bc97c77d0cd78e92ae&X-Amz-SignedHeaders=host&partNumber=5&uploadId=nG4GEyxzFBXOPQ7nVKAPpKAimOCn9s06JvknRvVuqhDmVwBNogCrZCqSK07_K3xcj5As6817yW5Z_lLMcoWzr9dRUh7ZeSMZNgegDhook3Eii8Fz6rRw5KY.AQT7tWWJ&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 6,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/19f69334-2345-458d-b212-b0c10b287584.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T115112Z&X-Amz-Expires=3600&X-Amz-Signature=e68f983b91e8e8aa928c569789e15db15684482c08e39a8e643f53a77f160c34&X-Amz-SignedHeaders=host&partNumber=6&uploadId=nG4GEyxzFBXOPQ7nVKAPpKAimOCn9s06JvknRvVuqhDmVwBNogCrZCqSK07_K3xcj5As6817yW5Z_lLMcoWzr9dRUh7ZeSMZNgegDhook3Eii8Fz6rRw5KY.AQT7tWWJ&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 7,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/19f69334-2345-458d-b212-b0c10b287584.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T115112Z&X-Amz-Expires=3600&X-Amz-Signature=afa25e7dbf153e42dfce0be6c82906545c2bc1466962cd4e3839d444c06b7904&X-Amz-SignedHeaders=host&partNumber=7&uploadId=nG4GEyxzFBXOPQ7nVKAPpKAimOCn9s06JvknRvVuqhDmVwBNogCrZCqSK07_K3xcj5As6817yW5Z_lLMcoWzr9dRUh7ZeSMZNgegDhook3Eii8Fz6rRw5KY.AQT7tWWJ&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 8,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/19f69334-2345-458d-b212-b0c10b287584.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T115112Z&X-Amz-Expires=3600&X-Amz-Signature=cf0d9254e2b20879bea442078da5fcc6388602066e367a9b284b7a6b6ceb7215&X-Amz-SignedHeaders=host&partNumber=8&uploadId=nG4GEyxzFBXOPQ7nVKAPpKAimOCn9s06JvknRvVuqhDmVwBNogCrZCqSK07_K3xcj5As6817yW5Z_lLMcoWzr9dRUh7ZeSMZNgegDhook3Eii8Fz6rRw5KY.AQT7tWWJ&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 9,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/19f69334-2345-458d-b212-b0c10b287584.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T115112Z&X-Amz-Expires=3600&X-Amz-Signature=bb0faa26c4616f7b3f5024e3e62a3fbf165d4fd9a9fce8e8717a9ceb3831bbc1&X-Amz-SignedHeaders=host&partNumber=9&uploadId=nG4GEyxzFBXOPQ7nVKAPpKAimOCn9s06JvknRvVuqhDmVwBNogCrZCqSK07_K3xcj5As6817yW5Z_lLMcoWzr9dRUh7ZeSMZNgegDhook3Eii8Fz6rRw5KY.AQT7tWWJ&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 10,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/19f69334-2345-458d-b212-b0c10b287584.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T115112Z&X-Amz-Expires=3600&X-Amz-Signature=29d94847f326d8cef58dc9524a3b800859564e0fc48aec538ea85ca327c2dc0e&X-Amz-SignedHeaders=host&partNumber=10&uploadId=nG4GEyxzFBXOPQ7nVKAPpKAimOCn9s06JvknRvVuqhDmVwBNogCrZCqSK07_K3xcj5As6817yW5Z_lLMcoWzr9dRUh7ZeSMZNgegDhook3Eii8Fz6rRw5KY.AQT7tWWJ&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 11,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/19f69334-2345-458d-b212-b0c10b287584.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T115112Z&X-Amz-Expires=3600&X-Amz-Signature=a6be078d3e5f48df1ab13255567e5288344d4bdb867dda91225384249d3eeaef&X-Amz-SignedHeaders=host&partNumber=11&uploadId=nG4GEyxzFBXOPQ7nVKAPpKAimOCn9s06JvknRvVuqhDmVwBNogCrZCqSK07_K3xcj5As6817yW5Z_lLMcoWzr9dRUh7ZeSMZNgegDhook3Eii8Fz6rRw5KY.AQT7tWWJ&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
  },
  {
    partNumber: 12,
    url: "https://video-transcoderrr.s3.ap-south-1.amazonaws.com/raw/19f69334-2345-458d-b212-b0c10b287584.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA4VDBLZDKS2HWNOD5%2F20260505%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Date=20260505T115112Z&X-Amz-Expires=3600&X-Amz-Signature=ce0cb7293b82135469c5cf3cac7577e3a7d0d97ac9cc8a1ae78f6779c7ba7076&X-Amz-SignedHeaders=host&partNumber=12&uploadId=nG4GEyxzFBXOPQ7nVKAPpKAimOCn9s06JvknRvVuqhDmVwBNogCrZCqSK07_K3xcj5As6817yW5Z_lLMcoWzr9dRUh7ZeSMZNgegDhook3Eii8Fz6rRw5KY.AQT7tWWJ&x-amz-checksum-crc32=AAAAAA%3D%3D&x-amz-sdk-checksum-algorithm=CRC32&x-id=UploadPart",
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
