/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { PlayCircle, ShieldAlert, Cpu } from "lucide-react";

export default function VideoCard({ video }: any) {
  const router = useRouter();

  const thumbnail = video.thumbnailS3key
    ? `https://video-transcoderrr.s3.ap-south-1.amazonaws.com/${video.thumbnailS3key}`
    : null;

  const statusColors: Record<string, string> = {
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    processing: "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse",
    failed: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  return (
    <div
      onClick={() => router.push(`video/${video.id}`)}
      className="group cursor-pointer bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden hover:border-zinc-800 hover:shadow-[0_8px_30px_rgb(0,0,0,0.7)] transition-all duration-300 flex flex-col h-full"
    >
      {/* Thumbnail Aspect Container */}
      <div className="aspect-video bg-zinc-900/60 relative flex items-center justify-center overflow-hidden border-b border-zinc-900">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={video.title || "Target Node Thumbnail"}
            width={480}
            height={270}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-zinc-600 group-hover:text-zinc-500 transition-colors">
            {video.status === 'failed' ? <ShieldAlert className="h-6 w-6 text-rose-500/40" /> : <PlayCircle className="h-6 w-6" />}
            <span className="text-[10px] font-mono tracking-wider">NO THUMBNAIL RAW</span>
          </div>
        )}
        
        {/* Glass Overlay on Hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="p-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white scale-95 group-hover:scale-100 transition-transform duration-300">
            <Cpu className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Card Metadata Segment */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <h3 className="text-xs font-semibold tracking-wide text-zinc-200 group-hover:text-blue-400 transition-colors line-clamp-1 font-mono">
          {video.title || "Untitled Processing Stream"}
        </h3>

        <div className="flex items-center justify-between gap-2 pt-1">
          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${statusColors[video.status] || 'bg-zinc-800 text-zinc-400 border-zinc-700'}`}>
            {video.status}
          </span>
          <span className="text-[9px] text-zinc-600 font-mono">
            {video.created_at ? new Date(video.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}) : 'Recent'}
          </span>
        </div>
      </div>
    </div>
  );
}