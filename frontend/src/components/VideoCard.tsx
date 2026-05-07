/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function VideoCard({ video }: any) {
  const router = useRouter();

  const thumbnail = video.thumbnailS3key
    ? `https://video-transcoderrr.s3.ap-south-1.amazonaws.com/${video.thumbnailS3key}`
    : null;

  return (
    <div
      onClick={() => router.push(`video/${video.id}`)}
      className="cursor-pointer bg-zinc-900 rounded-xl overflow-hidden hover:scale-105 transition"
    >
      <div className="aspect-video bg-zinc-800 flex items-center justify-center p-2">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={video.title || "Video Thumbnail"}
            width={1000}
            height={600}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-zinc-500 text-sm">No Thumbnail</span>
        )}
      </div>

      <div className="p-3 space-y-1">
        <h2 className="text-sm font-semibold truncate">
          { video.title || "Untitled Video"}
        </h2>

        <p className="text-xs text-zinc-400 capitalize">
          {video.status}
        </p>
      </div>
    </div>
  );
}
