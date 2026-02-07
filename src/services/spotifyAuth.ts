/**
 * Spotify OAuth: Authorization Code with PKCE (no client secret).
 * Tokens stored in localStorage; cleared on Disconnect.
 */

import { getSpotifyTokens, setSpotifyTokens, removeSpotifyTokens, type SpotifyTokens } from '@/store/storage'

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
const SESSION_VERIFIER_KEY = 'spotify_pkce_verifier'

const SCOPES = [
  'user-read-private',      // profile (display name, image)
  'playlist-read-private', // user playlists
  'user-library-read',     // liked songs
].join(' ')

function getConfig(): { clientId: string; redirectUri: string } {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID
  const redirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI ?? `${window.location.origin}/app/spotify-callback`
  return { clientId: clientId ?? '', redirectUri }
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomString(length: number): string {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return base64UrlEncode(bytes.buffer)
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const data = encoder.encode(plain)
  return crypto.subtle.digest('SHA-256', data)
}

/** Generate code_verifier and code_challenge for PKCE. */
async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomString(32)
  const hash = await sha256(verifier)
  const challenge = base64UrlEncode(hash)
  return { verifier, challenge }
}

/** Start OAuth: redirect to Spotify with PKCE. */
export async function startSpotifyLogin(): Promise<{ ok: boolean; error?: string }> {
  const { clientId, redirectUri } = getConfig()
  if (!clientId) return { ok: false, error: 'Spotify Client ID not configured. See docs/SPOTIFY_SETUP.md.' }

  try {
    const { verifier, challenge } = await generatePKCE()
    sessionStorage.setItem(SESSION_VERIFIER_KEY, verifier)
    const state = randomString(16)
    sessionStorage.setItem('spotify_oauth_state', state)

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      scope: SCOPES,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state,
    })
    window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Failed to start login.' }
  }
}

/** Exchange authorization code for tokens (called on callback page). */
export async function exchangeCodeForTokens(
  code: string,
  state: string
): Promise<{ ok: true; tokens: SpotifyTokens } | { ok: false; error: string }> {
  const savedState = sessionStorage.getItem('spotify_oauth_state')
  sessionStorage.removeItem('spotify_oauth_state')
  if (!savedState || savedState !== state) return { ok: false, error: 'Invalid state.' }

  const verifier = sessionStorage.getItem(SESSION_VERIFIER_KEY)
  sessionStorage.removeItem(SESSION_VERIFIER_KEY)
  if (!verifier) return { ok: false, error: 'Missing code verifier.' }

  const { clientId, redirectUri } = getConfig()
  if (!clientId) return { ok: false, error: 'Spotify Client ID not configured.' }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  })

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    return { ok: false, error: `Token exchange failed: ${res.status}. ${text.slice(0, 100)}` }
  }

  const data = (await res.json()) as {
    access_token: string
    expires_in: number
    refresh_token?: string
  }
  const expires_at = Date.now() + data.expires_in * 1000
  const tokens: SpotifyTokens = {
    access_token: data.access_token,
    expires_at,
    refresh_token: data.refresh_token,
  }
  setSpotifyTokens(tokens)
  return { ok: true, tokens }
}

/** Refresh access token using refresh_token. */
async function refreshAccessToken(refreshToken: string): Promise<SpotifyTokens | null> {
  const { clientId } = getConfig()
  if (!clientId) return null

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  const res = await fetch(SPOTIFY_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) return null
  const data = (await res.json()) as {
    access_token: string
    expires_in: number
    refresh_token?: string
  }
  const expires_at = Date.now() + data.expires_in * 1000
  const tokens: SpotifyTokens = {
    access_token: data.access_token,
    expires_at,
    refresh_token: data.refresh_token ?? refreshToken,
  }
  setSpotifyTokens(tokens)
  return tokens
}

/** Get a valid access token (use existing or refresh). Call before any API request. */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = getSpotifyTokens()
  if (!tokens) return null
  const bufferMs = 60 * 1000
  if (tokens.expires_at > Date.now() + bufferMs) return tokens.access_token
  if (tokens.refresh_token) {
    const newTokens = await refreshAccessToken(tokens.refresh_token)
    return newTokens?.access_token ?? null
  }
  return null
}

/** Clear tokens and any Spotify session data. */
export function disconnectSpotify(): void {
  removeSpotifyTokens()
  sessionStorage.removeItem(SESSION_VERIFIER_KEY)
  sessionStorage.removeItem('spotify_oauth_state')
}

/** Whether Spotify is configured (Client ID set). */
export function isSpotifyConfigured(): boolean {
  return !!import.meta.env.VITE_SPOTIFY_CLIENT_ID
}
