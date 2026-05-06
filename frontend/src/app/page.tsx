/* eslint-disable @typescript-eslint/no-explicit-any */
import VideoCard from "@/components/VideoCard";
import UploadVideo from "@/components/UploadVideo";

const API = process.env.NEXT_PUBLIC_API_URL;

async function getVideos() {
  const res = await fetch(`${API}/videos`, { cache: "no-store" });

  return res.json();
}

export default async function HomePage() {
  const videos = await getVideos();

  return (
    <div className="min-h-screen bg-black text-white px-6 py-8 space-y-10">
      {/* Header */}
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">🎬 Video Platform</h1>

        {/* Upload Section */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Video</h2>
          <UploadVideo />
        </div>
      </div>

      {/* Video List */}
      <div className="max-w-6xl mx-auto space-y-4">
        <h2 className="text-xl font-semibold">All Videos</h2>

        {videos.length === 0 ? (
          <div className="text-zinc-500 text-sm">
            No videos yet. Upload your first one 🚀
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {videos.map((video: any) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
