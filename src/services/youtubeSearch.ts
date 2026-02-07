const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

export interface YouTubeSearchItem {
  videoId: string
  title: string
  channelTitle: string
  thumbnailUrl: string
}

/** Search YouTube Data API v3 (search.list). Returns up to 6 video results. Requires VITE_YOUTUBE_API_KEY. */
export async function searchYouTubeVideos(query: string, apiKey: string): Promise<YouTubeSearchItem[]> {
  if (!query.trim() || !apiKey.trim()) return []
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    maxResults: '6',
    q: query.trim(),
    key: apiKey,
    videoEmbeddable: 'true',
    safeSearch: 'moderate',
  })
  const url = `${YOUTUBE_API_BASE}/search?${params.toString()}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = (await res.json()) as {
      items?: Array<{
        id?: { kind?: string; videoId?: string }
        snippet?: { title?: string; channelTitle?: string; thumbnails?: { default?: { url?: string } } }
      }>
    }
    const items = data.items ?? []
    return items
      .filter((i) => i.id?.videoId && i.snippet)
      .map((i) => ({
        videoId: i.id!.videoId!,
        title: i.snippet!.title ?? '',
        channelTitle: i.snippet!.channelTitle ?? '',
        thumbnailUrl: i.snippet!.thumbnails?.default?.url ?? '',
      }))
  } catch {
    return []
  }
}
