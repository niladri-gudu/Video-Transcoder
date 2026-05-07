"use client";

import { useState, useEffect } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { socket } from "../lib/socket";

const API = process.env.NEXT_PUBLIC_API_URL;

type VideoStatus =
  | "loading"
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export default function VideoClient({ id }: { id: string }) {
  const [status, setStatus] = useState<VideoStatus>("loading");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");

  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("Initializing");

  useEffect(() => {
    const fetchInitialStatus = async () => {
      try {
        const res = await fetch(`${API}/videos/${id}`);

        const data = await res.json();

        setStatus(data.status);

        if (data.status === "completed") {
          setVideoUrl(
            `https://video-transcoderrr.s3.ap-south-1.amazonaws.com/processed/hls/${id}/master.m3u8`,
          );
        }
      } catch (error) {
        console.error(error);
        setError("Failed to fetch video status");
      }
    };

    fetchInitialStatus();

    socket.on("connect", () => {
      socket.emit("join-video", id);
    });
    socket.on("video-progress", (data) => {
      console.log("Progress update:", data);

      setProgress(data.progress);
      setStep(data.step);

      if (data.progress >= 100) {
        setStatus("completed");

        setVideoUrl(
          `https://video-transcoderrr.s3.ap-south-1.amazonaws.com/processed/hls/${id}/master.m3u8`,
        );

        return;
      }

      if (data.progress === -1) {
        setStatus("failed");

        return;
      }

      setStatus("processing");
    });

    return () => {
      socket.off("video-progress");
    };
  }, [id]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (status === "pending" || status === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white px-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold">⏳ Processing Video</h1>

            <p className="text-zinc-400 text-sm">
              Your video is being transcoded for adaptive streaming.
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">{step}</span>

              <span className="text-zinc-500">{progress}%</span>
            </div>

            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-500"
                style={{
                  width: `${Math.max(progress, 5)}%`,
                }}
              />
            </div>
          </div>

          <div className="text-center text-xs text-zinc-500">
            Video ID: {id}
          </div>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="min-h-screen bg-black text-red-500 flex items-center justify-center">
        ❌ Video processing failed
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex items-center justify-center">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <VideoPlayer src={videoUrl} />

        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>Video ID: {id}</span>

          <span className="text-green-500">✅ Ready to stream</span>
        </div>
      </div>
    </div>
  );
}
