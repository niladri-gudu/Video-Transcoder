"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { UploadCloud, FileVideo, AlertCircle, RefreshCw } from "lucide-react";

export default function UploadVideo() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string>("idle");
  const [error, setError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API_URL;

  const handleUpload = async () => {
    if (!file) return;

    try {
      setError("");
      setStatus("Initializing upload...");

      const initRes = await fetch(`${API}/videos/multipart/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name }),
      });

      const { uploadId, key, videoId } = await initRes.json();
      const chunkSize = 10 * 1024 * 1024;
      const partCount = Math.ceil(file.size / chunkSize);

      const urlRes = await fetch(`${API}/videos/multipart/urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, key, partCount }),
      });

      const { urls } = await urlRes.json();
      const parts: { ETag: string; PartNumber: number }[] = [];

      setStatus("Streaming Chunks to S3...");

      for (let i = 0; i < urls.length; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const blob = file.slice(start, end);

        const res = await fetch(urls[i].url, {
          method: "PUT",
          body: blob,
        });

        const etag = res.headers.get("ETag")!.replaceAll('"', "");
        parts.push({ ETag: etag, PartNumber: urls[i].partNumber });
        setProgress(Math.round(((i + 1) / urls.length) * 100));
      }

      setStatus("Finalizing Upload...");

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos/multipart/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId, key, parts, videoId }),
      });

      setStatus("Upload Complete");
      router.push(`/video/${videoId}`);
    } catch (error) {
      console.error(error);
      setError("Multi-part payload allocation failed to execute.");
      setStatus("idle");
    }
  };

  return (
    <div className="space-y-4">
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="hidden"
      />

      {/* Interactive Dropzone Block Layout */}
      <div 
        onClick={() => status === "idle" && fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          status !== "idle" ? "border-zinc-800 bg-zinc-950/20 cursor-not-allowed" : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/10 hover:bg-zinc-900/30 cursor-pointer"
        }`}
      >
        {file ? (
          <div className="flex flex-col items-center justify-center space-y-2">
            <FileVideo className="h-8 w-8 text-blue-500" />
            <p className="text-xs text-zinc-200 font-mono truncate max-w-xs">{file.name}</p>
            <p className="text-[10px] text-zinc-500 font-mono">({(file.size / (1024 * 1024)).toFixed(2)} MB)</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            <UploadCloud className="h-8 w-8 text-zinc-600 group-hover:text-zinc-500" />
            <p className="text-xs text-zinc-400 font-medium">Click to select raw video file component</p>
            <p className="text-[10px] text-zinc-600 font-mono">Supports production MP4, MKV, MOV binaries</p>
          </div>
        )}
      </div>

      {file && status === "idle" && (
        <button
          onClick={handleUpload}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-blue-600/10"
        >
          UPLOAD VIDEO
        </button>
      )}

      {/* Ingestion Engine Progress Meter */}
      {status !== "idle" && (
        <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl space-y-3 font-mono">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" /> {status}
            </span>
            <span className="text-blue-400 font-bold">{progress}%</span>
          </div>

          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-mono">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}