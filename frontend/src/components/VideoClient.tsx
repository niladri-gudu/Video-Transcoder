/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  Sparkles,
  Send,
  Video,
  Calendar,
  Bot,
  User,
  CheckCircle2,
  Loader2,
  Terminal,
} from "lucide-react";
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
  const [videoData, setVideoData] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [captionsUrl, setCaptionsUrl] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string; timestamp: string }[]
  >([]);

  const [loadingChat, setLoadingChat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState("Initializing");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new chat messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingChat]);

  useEffect(() => {
    const fetchInitialStatus = async () => {
      try {
        const res = await fetch(`${API}/videos/${id}`);
        const data = await res.json();
        setVideoData(data);
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
        setError("Failed to fetch video infrastructure data");
      }
    };

    fetchInitialStatus();

    const handleConnect = () => {
      socket.emit("join-video", id);
    };

    const handleProgress = (data: any) => {
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

    if (socket.connected) handleConnect();
    socket.on("connect", handleConnect);
    socket.on("video-progress", handleProgress);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("video-progress", handleProgress);
    };
  }, [id]);

  const sendMessage = async (explicitMsg?: string) => {
    const messageToSend = explicitMsg || message;
    if (!messageToSend.trim()) return;

    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      { role: "user", content: messageToSend, timestamp: currentTime },
    ]);
    if (!explicitMsg) setMessage("");
    setLoadingChat(true);

    try {
      const res = await fetch(`${API}/videos/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "**Error**: Failed to establish connection with RAG pipeline backend node.",
          timestamp: currentTime,
        },
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const samplePrompts = [
    "✨ Summarize this video",
    "📋 What are the main highlights?",
    "🧠 Explain this like I'm five",
    "⏳ Give me the TL;DR",
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex flex-col gap-4 items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        <p className="text-sm text-zinc-400 font-mono tracking-wider">
          RESOLVING PIPELINE INFRASTRUCTURE...
        </p>
      </div>
    );
  }

  if (status === "pending" || status === "processing") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b] text-white px-6">
        <div className="w-full max-w-lg bg-zinc-950/40 backdrop-blur-md border border-zinc-800/80 p-8 rounded-3xl space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mb-2 animate-pulse">
              <Video className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              {status === "pending"
                ? "Video is queued for processing."
                : "Video is currently being processed."}
            </h1>
            <p className="text-zinc-400 text-xs font-mono max-w-xs mx-auto">
              This may take a few moments depending on the video length and
              cluster load. Sit tight!
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                {step}
              </span>
              <span className="text-blue-400 font-bold">{progress}%</span>
            </div>

            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden p-[2px] border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
                style={{ width: `${Math.max(progress, 5)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.1),rgba(255,255,255,0))] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dynamic Header Row */}
        <div className="mb-8 border-b border-zinc-900 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
              <Video className="text-blue-500 h-5 w-5" />
              {videoData?.title || "Production Stream Metrics"}
            </h1>

            {/* Metadata Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-2 font-mono">
              <span className="text-zinc-600">ID: {id}</span>
            </div>
          </div>
        </div>

        {/* Workspace Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Media Deck */}
          <div className="lg:col-span-2 space-y-6">
            <div className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-950/20 overflow-hidden shadow-2xl transition-all duration-300 hover:border-zinc-700/50">
              <VideoPlayer src={videoUrl} captionsUrl={captionsUrl} />
            </div>
          </div>

          {/* Right Chat Panel (Premium Glassmorphism Design) */}
          <div className="bg-zinc-950/40 backdrop-blur-xl border border-zinc-800/90 rounded-2xl flex flex-col h-[75vh] shadow-[0_20px_50px_rgba(0,0,0,0.55)] relative overflow-hidden">
            {/* Ambient Panel Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Panel Header */}
            <div className="border-b border-zinc-800/80 px-5 py-4 bg-zinc-950/60 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-blue-400">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm tracking-wide text-zinc-200">
                    Chat with Video
                  </h2>
                </div>
              </div>
            </div>

            {/* Conversation Core */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
              {messages.length === 0 && (
                <div className="h-full flex flex-col justify-center space-y-4 py-4">
                  <div className="text-center space-y-1">
                    <Sparkles className="h-5 w-5 text-zinc-600 mx-auto mb-1 animate-pulse" />
                    <p className="text-xs text-zinc-400 font-medium">
                      Ask Questions About This Video
                    </p>
                    <p className="text-[11px] text-zinc-600 max-w-[200px] mx-auto">
                      Our LLM compiles real-time dynamic context using local
                      vector embeddings.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    {samplePrompts.map((prompt, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() =>
                          sendMessage(prompt.replace(/^[^ ]+ /, ""))
                        }
                        className="w-full text-left bg-zinc-900/50 hover:bg-zinc-800/60 border border-zinc-800/60 hover:border-zinc-700/80 rounded-xl p-3 text-xs text-zinc-400 hover:text-zinc-200 transition-all duration-200 shadow-sm"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role !== "user" && (
                    <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0 mt-0.5">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                  )}

                  <div
                    className={`flex flex-col space-y-1 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-xs leading-relaxed border shadow-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500/30"
                          : "bg-zinc-900/70 border-zinc-800/80 text-zinc-300 backdrop-blur-sm"
                      }`}
                    >
                      {msg.role === "user" ? (
                        <p>{msg.content}</p>
                      ) : (
                        <div className="prose prose-invert prose-xs max-w-none text-zinc-300 markdown-content">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-zinc-600 font-mono px-1">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.role === "user" && (
                    <div className="h-7 w-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                      <User className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              ))}

              {loadingChat && (
                <div className="flex gap-3 justify-start">
                  <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                  <div className="bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form Deck */}
            <div className="border-t border-zinc-800/80 p-4 bg-zinc-950/50 backdrop-blur-md">
              <div className="flex gap-2 relative items-center">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !loadingChat) sendMessage();
                  }}
                  placeholder="Type your message..."
                  className="w-full bg-zinc-900/80 border border-zinc-800/80 rounded-xl pl-4 pr-12 py-3 text-xs text-zinc-200 outline-none focus:border-blue-500/50 transition-all font-mono"
                />

                <button
                  onClick={() => sendMessage()}
                  disabled={loadingChat || !message.trim()}
                  className="absolute right-2 p-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-20 text-white transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
