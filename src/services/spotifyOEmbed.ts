/** Only track links have predictable oEmbed shape; album/playlist may differ. */
export function isSpotifyTrackUrl(url: string): boolean {
  try {
    const u = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`)
    return u.hostname.includes('open.spotify.com') && u.pathname.includes('/track/')
  } catch {
    return false
  }
}

/** Normalize to canonical track URL for cache key. */
export function normalizeSpotifyTrackUrl(url: string): string {
  try {
    const u = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`)
    if (u.hostname.includes('open.spotify.com') && u.pathname.includes('/track/')) {
      return `https://open.spotify.com${u.pathname}`
    }
  } catch {
    // ignore
  }
  return url.trim()
}

export interface SpotifyOEmbedResult {
  title: string
  author_name: string
}

/** Parse oEmbed title (often "Track Name - Artist Name") into track and artist. */
export function parseTitleToTrackAndArtist(title: string): { trackTitle: string; artist: string } {
  const t = (title ?? '').trim()
  if (!t) return { trackTitle: '', artist: '' }
  const idx = t.indexOf(' - ')
  if (idx === -1) return { trackTitle: t, artist: '' }
  return {
    trackTitle: t.slice(0, idx).trim(),
    artist: t.slice(idx + 3).trim(),
  }
}

/** Build YouTube search query: "artist trackTitle audio" (or "trackTitle audio" if no artist). */
export function buildSearchQueryFromOEmbed(
  title: string,
  authorName?: string
): string {
  const { trackTitle, artist } = parseTitleToTrackAndArtist(title)
  const effectiveArtist = artist || (authorName ?? '').trim()
  const base = effectiveArtist ? `${effectiveArtist} ${trackTitle}`.trim() : trackTitle
  return base ? `${base} audio` : 'audio'
}

/** Fetch Spotify oEmbed for a track URL. Returns null if not a track or request fails. */
export async function fetchSpotifyTrackOEmbed(spotifyUrl: string): Promise<SpotifyOEmbedResult | null> {
  if (!isSpotifyTrackUrl(spotifyUrl)) return null
  const data = await fetchSpotifyOEmbed(spotifyUrl)
  if (!data || typeof data.title !== 'string') return null
  return {
    title: data.title,
    author_name: data.author_name ?? '',
  }
}

/** Fetch Spotify oEmbed for any Spotify URL (track, album, playlist). Returns title/author_name if present. */
export async function fetchSpotifyOEmbed(spotifyUrl: string): Promise<{ title?: string; author_name?: string } | null> {
  const trimmed = spotifyUrl.trim().startsWith('http') ? spotifyUrl.trim() : `https://${spotifyUrl.trim()}`
  try {
    const u = new URL(trimmed)
    if (!u.hostname.includes('open.spotify.com')) return null
  } catch {
    return null
  }
  const encoded = encodeURIComponent(trimmed)
  const url = `https://open.spotify.com/oembed?url=${encoded}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { title?: string; author_name?: string }
    if (typeof data.title !== 'string') return null
    return { title: data.title, author_name: data.author_name }
  } catch {
    return null
  }
}
