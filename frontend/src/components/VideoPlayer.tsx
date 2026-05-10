"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

export default function VideoPlayer({
  src,
  captionsUrl,
}: {
  src: string;
  captionsUrl?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else if (Hls.isSupported()) {
      const hls = new Hls();

      hls.loadSource(src);
      hls.attachMedia(video);

      return () => hls.destroy();
    }
  }, [src]);

  return (
    <video
      ref={videoRef}
      controls
      crossOrigin="anonymous"
      className="w-full rounded-2xl shadow-lg"
    >
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
  );
}
