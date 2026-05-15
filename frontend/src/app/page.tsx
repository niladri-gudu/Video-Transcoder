/* eslint-disable @typescript-eslint/no-explicit-any */
import VideoCard from "@/components/VideoCard";
import UploadVideo from "@/components/UploadVideo";
import { Layers, Database, HardDrive, Cpu } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

async function getVideos() {
  const res = await fetch(`${API}/videos`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Failed to pull platform registry context");
  }
  return res.json();
}

export default async function HomePage() {
  const videos = await getVideos();

  return (
    <div className="min-h-screen bg-[#030303] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(59,130,246,0.08),rgba(255,255,255,0))] text-white font-sans antialiased">
      {/* Header Deck */}
      <div className="border-b border-zinc-900 bg-zinc-950/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                Distributed Video Processing Pipeline
              </h1>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">
              Concurrent Multipart S3 Upload Engine • FFmpeg HLS Transcoder
            </p>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        {/* Upload Segment Wrapper */}
        <section className="bg-zinc-950/40 backdrop-blur-md border border-zinc-900 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-zinc-200">
              Upload a Video File
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-mono">
              S3 chunks are processed concurrently via chunk sequence
              allocations.
            </p>
          </div>
          <UploadVideo />
        </section>

        {/* Distributed Repository Array */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <h2 className="text-base font-semibold text-zinc-200">
              Video Repository
            </h2>
          </div>

          {videos.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-16 text-center bg-zinc-950/10 backdrop-blur-sm">
              <p className="text-zinc-400 text-sm font-medium">
                No videos have been uploaded yet.
              </p>
              <p className="text-zinc-600 text-xs mt-1 font-mono">
                Once you upload a video, it will appear here with real-time status updates as it goes through the ingestion pipeline.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video: any) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
