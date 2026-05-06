import VideoClient from "./VideoClient";

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <VideoClient id={id} />;
}