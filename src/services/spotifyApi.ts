/**
 * Spotify Web API calls. Use getValidAccessToken() before each request.
 */

import { getValidAccessToken } from './spotifyAuth'

const BASE = 'https://api.spotify.com/v1'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getValidAccessToken()
  if (!token) throw new Error('Not connected to Spotify')
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  })
  if (res.status === 401) throw new Error('Spotify session expired. Please reconnect.')
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`)
  return res.json() as Promise<T>
}

export interface SpotifyUser {
  id: string
  display_name: string | null
  images: { url: string; height: number; width: number }[]
}

export async function getCurrentUser(): Promise<SpotifyUser> {
  return request<SpotifyUser>('/me')
}

export interface SpotifyPlaylist {
  id: string
  name: string
  owner: { display_name: string }
  tracks: { total: number }
  images: { url: string }[]
}

export interface SpotifyPlaylistsResponse {
  items: SpotifyPlaylist[]
  next: string | null
  total: number
}

export async function getPlaylists(limit = 50, offset = 0): Promise<SpotifyPlaylistsResponse> {
  return request<SpotifyPlaylistsResponse>(`/me/playlists?limit=${limit}&offset=${offset}`)
}

export async function getPlaylistsNext(url: string): Promise<SpotifyPlaylistsResponse> {
  const token = await getValidAccessToken()
  if (!token) throw new Error('Not connected to Spotify')
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`)
  return res.json() as Promise<SpotifyPlaylistsResponse>
}

export interface SpotifyTrackItem {
  added_at?: string
  track: SpotifyTrack | null
}

export interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  external_urls: { spotify: string }
  artists: { name: string }[]
  album: { name: string; images: { url: string }[] }
}

export interface SpotifyPlaylistTracksResponse {
  items: SpotifyTrackItem[]
  next: string | null
  total: number
}

export async function getPlaylistTracks(
  playlistId: string,
  limit = 100,
  offset = 0
): Promise<SpotifyPlaylistTracksResponse> {
  return request<SpotifyPlaylistTracksResponse>(
    `/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}&fields=items(added_at,track(id,name,duration_ms,external_urls,artists,album))`
  )
}

export async function getPlaylistTracksNext(url: string): Promise<SpotifyPlaylistTracksResponse> {
  const token = await getValidAccessToken()
  if (!token) throw new Error('Not connected to Spotify')
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`)
  return res.json() as Promise<SpotifyPlaylistTracksResponse>
}

export interface SpotifySavedTrack {
  added_at: string
  track: SpotifyTrack
}

export interface SpotifySavedTracksResponse {
  items: SpotifySavedTrack[]
  next: string | null
  total: number
}

export async function getSavedTracks(
  limit = 50,
  offset = 0
): Promise<SpotifySavedTracksResponse> {
  return request<SpotifySavedTracksResponse>(`/me/tracks?limit=${limit}&offset=${offset}`)
}

export async function getSavedTracksNext(url: string): Promise<SpotifySavedTracksResponse> {
  const token = await getValidAccessToken()
  if (!token) throw new Error('Not connected to Spotify')
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`)
  return res.json() as Promise<SpotifySavedTracksResponse>
}

/** Normalized track for UI/import. */
export interface NormalizedTrack {
  id: string
  name: string
  artists: string
  album: string
  duration_ms: number
  url: string
  artworkUrl: string | null
}

export function normalizeTrack(t: SpotifyTrack): NormalizedTrack {
  return {
    id: t.id,
    name: t.name,
    artists: t.artists.map((a) => a.name).join(', '),
    album: t.album?.name ?? '',
    duration_ms: t.duration_ms,
    url: t.external_urls?.spotify ?? `https://open.spotify.com/track/${t.id}`,
    artworkUrl: t.album?.images?.[0]?.url ?? null,
  }
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}
