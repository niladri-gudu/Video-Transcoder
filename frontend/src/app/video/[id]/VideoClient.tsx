"use client";

import { useState, useEffect } from "react";
import VideoPlayer from "@/components/VideoPlayer";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function VideoClient({ id }: { id: string }) {
  const [status, setStatus] = useState<
    "loading" | "pending" | "processing" | "completed" | "failed"
  >("loading");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout = setInterval(() => {});

    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API}/videos/${id}`);

        const data = await res.json();

        setStatus(data.status);

        if (data.status === "completed") {
          setVideoUrl(
            `https://video-transcoderrr.s3.ap-south-1.amazonaws.com/processed/hls/${id}/master.m3u8`,
          );

          clearInterval(interval);
        }
      } catch (error) {
        console.error(error);
        setError("Failed to fetch video status");
        clearInterval(interval);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 3000);

    return () => clearInterval(interval);
  }, [id]);

  if (status === "loading") {
    return <div className="text-white p-10">Loading...</div>;
  }

  if (status === "pending" || status === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="space-y-4 text-center">
          <div className="text-xl">⏳ Processing video...</div>

          <div className="w-64 bg-zinc-700 h-2 rounded">
            <div className="bg-blue-500 h-2 w-1/2 animate-pulse rounded" />
          </div>

          <div className="text-sm text-zinc-400">
            This may take a few seconds...
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return <div className="text-red-500 p-10">❌ Video processing failed</div>;
  }

  if (error) {
    return <div className="text-red-500 p-10">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <VideoPlayer src={videoUrl} />

        <div className="text-sm text-zinc-400">Video ID: {id}</div>
      </div>
    </div>
  );
}
