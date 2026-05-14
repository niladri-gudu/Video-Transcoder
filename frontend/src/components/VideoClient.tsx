/* eslint-disable @typescript-eslint/no-explicit-any */
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
  const [captionsUrl, setCaptionsUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      content: string;
    }[]
  >([]);

  const [loadingChat, setLoadingChat] = useState(false);
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
          setCaptionsUrl(
            `https://video-transcoderrr.s3.ap-south-1.amazonaws.com/processed/captions/${id}.vtt`,
          );
        }
      } catch (error) {
        console.error(error);
        setError("Failed to fetch video status");
      }
    };

    fetchInitialStatus();

    const handleConnect = () => {
      console.log("Joining room:", id);

      socket.emit("join-video", id);
    };

    const handleProgress = (data: any) => {
      console.log("Progress update:", data);

      setProgress(data.progress);
      setStep(data.step);

      if (data.progress >= 100) {
        setStatus("completed");

        setVideoUrl(
          `https://video-transcoderrr.s3.ap-south-1.amazonaws.com/processed/hls/${id}/master.m3u8`,
        );

        setCaptionsUrl(
          `https://video-transcoderrr.s3.ap-south-1.amazonaws.com/processed/captions/${id}.vtt`,
        );

        return;
      }

      if (data.progress === -1) {
        setStatus("failed");

        return;
      }

      setStatus("processing");
    };

    if (socket.connected) {
      handleConnect();
    }

    socket.on("connect", handleConnect);

    socket.on("video-progress", handleProgress);

    return () => {
      socket.off("connect", handleConnect);

      socket.off("video-progress", handleProgress);
    };
  }, [id]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    setMessage("");

    setLoadingChat(true);

    try {
      const res = await fetch(`${API}/videos/${id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response },
      ]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to generate response.",
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

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
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-4">
            <VideoPlayer src={videoUrl} captionsUrl={captionsUrl} />

            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Video ID: {id}</span>

              <span className="text-green-500">✅ Ready to stream</span>
            </div>
          </div>

          {/* RIGHT CHAT PANEL */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col h-[80vh]">
            {/* Header */}
            <div className="border-b border-zinc-800 px-5 py-4">
              <h2 className="font-semibold text-lg">🤖 Chat With Video</h2>

              <p className="text-sm text-zinc-500 mt-1">
                Ask anything about this video
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.length === 0 && (
                <div className="text-sm text-zinc-500 space-y-3">
                  <div>Try asking:</div>

                  <div className="space-y-2">
                    <div className="bg-zinc-900 rounded-xl p-3">
                      Summarize this video
                    </div>

                    <div className="bg-zinc-900 rounded-xl p-3">
                      What are the key topics discussed?
                    </div>

                    <div className="bg-zinc-900 rounded-xl p-3">
                      Explain the architecture used
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-900 text-zinc-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loadingChat && (
                <div className="flex justify-start">
                  <div className="bg-zinc-900 rounded-2xl px-4 py-3 text-sm text-zinc-400">
                    Thinking...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-zinc-800 p-4">
              <div className="flex gap-3">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loadingChat) {
                      sendMessage();
                    }
                  }}
                  placeholder="Ask about the video..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
                />

                <button
                  onClick={sendMessage}
                  disabled={loadingChat}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 rounded-xl text-sm font-medium transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
