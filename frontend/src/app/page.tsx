/* eslint-disable @typescript-eslint/no-explicit-any */
import VideoCard from "@/components/VideoCard";
import UploadVideo from "@/components/UploadVideo";

const API = process.env.NEXT_PUBLIC_API_URL;

async function getVideos() {
  const res = await fetch(`${API}/videos`, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch videos");
  }

  return res.json();
}

export default async function HomePage() {
  const videos = await getVideos();

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              🎬 Video Platform
            </h1>

            <p className="text-sm text-zinc-500 mt-1">
              Upload, transcode and stream videos in realtime
            </p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Upload Section */}
        <section className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Upload Video</h2>

            <p className="text-sm text-zinc-500 mt-1">
              Supports multipart uploads, HLS transcoding and realtime
              processing updates.
            </p>
          </div>

          <UploadVideo />
        </section>

        {/* Videos */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">All Videos</h2>

            <span className="text-sm text-zinc-500">
              {videos.length} videos
            </span>
          </div>

          {videos.length === 0 ? (
            <div className="border border-dashed border-zinc-800 rounded-2xl p-12 text-center bg-zinc-950">
              <p className="text-zinc-400 text-lg">No videos uploaded yet</p>

              <p className="text-zinc-600 text-sm mt-2">
                Upload your first video to start processing 🚀
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
