"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";

export default function VideoPlayer({
  src,
  captionsUrl,
}: {
  src: string;
  captionsUrl?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const hlsRef = useRef<Hls | null>(null);

  const [qualities, setQualities] = useState<number[]>([]);

  const [currentQuality, setCurrentQuality] = useState(-1);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls();

      hlsRef.current = hls;

      hls.loadSource(src);

      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        console.log("LEVELS:", data.levels);

        const availableQualities = data.levels
          .map((level) => level.height)
          .filter(Boolean);

        console.log("QUALITIES:", availableQualities);

        setQualities(availableQualities);

        setLoading(false);
      });

      return () => hls.destroy();
    }
  }, [src]);

  const changeQuality = (quality: number) => {
    if (!hlsRef.current) return;

    if (quality === -1) {
      hlsRef.current.currentLevel = -1;

      setCurrentQuality(-1);

      return;
    }

    const levelIndex = hlsRef.current.levels.findIndex(
      (level) => level.height === quality,
    );

    hlsRef.current.currentLevel = levelIndex;

    setCurrentQuality(quality);
  };

  return (
    <div className="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl border border-zinc-800">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
          <div className="text-white text-sm animate-pulse">
            Loading video...
          </div>
        </div>
      )}

      <video ref={videoRef} controls crossOrigin="anonymous" className="w-full">
        {captionsUrl && (
          <track
            kind="subtitles"
            srcLang="en"
            label="English"
            src={captionsUrl}
            default
          />
        )}
      </video>

      <div className="absolute top-4 right-4 flex gap-2 z-20">
        <select
          value={currentQuality}
          onChange={(e) => changeQuality(Number(e.target.value))}
          className="bg-black/80 border border-zinc-700 text-white text-xs rounded-lg px-2 py-1"
        >
          <option value={-1}>Auto</option>

          {qualities.map((quality) => (
            <option key={quality} value={quality}>
              {quality}p
            </option>
          ))}
        </select>

        <select
          onChange={(e) => {
            if (videoRef.current) {
              videoRef.current.playbackRate = Number(e.target.value);
            }
          }}
          className="bg-black/80 border border-zinc-700 text-white text-xs rounded-lg px-2 py-1"
          defaultValue="1"
        >
          <option value="0.5">0.5x</option>

          <option value="1">1x</option>

          <option value="1.25">1.25x</option>

          <option value="1.5">1.5x</option>

          <option value="2">2x</option>
        </select>
      </div>
    </div>
  );
}
