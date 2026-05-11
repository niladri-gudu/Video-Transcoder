export async function getTranscript(transcriptUrl: string) {
  const response = await fetch(transcriptUrl);

  if (!response.ok) {
    throw new Error("Failed to fetch transcript");
  }

  return response.text();
}
