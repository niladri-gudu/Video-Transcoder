"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

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
      setStatus("starting");

      const initRes = await fetch(`${API}/videos/multipart/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName: file.name }),
      });

      const { uploadId, key, videoId } = await initRes.json();

      const chunkSize = 10 * 1024 * 1024;
      const partCount = Math.ceil(file.size / chunkSize);

      const urlRes = await fetch(`${API}/videos/multipart/urls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uploadId, key, partCount }),
      });

      const { urls } = await urlRes.json();

      const parts: { ETag: string; PartNumber: number }[] = [];

      setStatus("uploading");

      for (let i = 0; i < urls.length; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);

        const blob = file.slice(start, end);

        const res = await fetch(urls[i].url, {
          method: "PUT",
          body: blob,
        });

        const etag = res.headers.get("ETag")!.replaceAll('"', "");

        parts.push({
          ETag: etag,
          PartNumber: urls[i].partNumber,
        });

        setProgress(Math.round(((i + 1) / urls.length) * 100));
      }

      setStatus("finalizing");

      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/videos/multipart/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uploadId, key, parts, videoId }),
        },
      );

      setStatus("done");

      router.push(`/video/${videoId}`);
    } catch (error) {
      console.error(error);
      setError("Upload failed. Please try again.");
      setStatus("idle");
    }
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-lg space-y-4">
      <input
        type="file"
        accept="video/*"
        ref={fileInputRef}
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-zinc-800 px-4 py-2 rounded-lg hover:bg-zinc-700"
      >
        Select Video
      </button>

      {file && (
        <div className="text-sm text-zinc-300">Selected: {file.name}</div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || status === "uploading"}
        className="bg-blue-600 px-4 py-2 rounded-lg hover:bg-blue-500 disabled:opacity-50"
      >
        Upload Video
      </button>

      {status !== "idle" && (
        <div className="space-y-2">
          <div className="text-sm">Status: {status}</div>

          <div className="w-full bg-zinc-700 h-2 rounded">
            <div
              className="bg-green-500 h-2 rounded"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-xs text-zinc-400">Progress: {progress}%</div>
        </div>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
}
