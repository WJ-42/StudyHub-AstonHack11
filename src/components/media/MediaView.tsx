import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { getMediaLinks, setMediaLinks } from '@/store/storage'
import { useSpotify } from '@/hooks/useSpotify'
import { SpotifyLibrary } from './SpotifyLibrary'
import { SpotifyDualModeCard } from './SpotifyDualModeCard'

type Provider = 'spotify' | 'youtube'

function getEmbedUrl(provider: Provider, url: string): string | null {
  try {
    const u = new URL(url.trim())
    if (provider === 'spotify') {
      if (u.hostname.includes('open.spotify.com')) {
        const path = u.pathname + u.search
        return `https://open.spotify.com/embed${path}`
      }
      return null
    }
    if (provider === 'youtube') {
      let vid = u.searchParams.get('v')
      if (!vid && u.hostname === 'youtu.be') vid = u.pathname.slice(1)
      if (vid) return `https://www.youtube.com/embed/${vid}`
      return null
    }
  } catch {
    return null
  }
  return null
}

function getLoadedLabel(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url.slice(0, 40) + (url.length > 40 ? '…' : '')
  }
}

function getProviderNameForMessage(storageKey: string): string {
  if (storageKey === 'spotify') return 'Spotify'
  if (storageKey === 'youtube') return 'YouTube'
  return storageKey
}

/** Embed heights: match provider defaults so container wraps iframe with no extra space. */
const EMBED_HEIGHT: Record<Provider, string> = {
  spotify: '352px',   // Spotify recommended standard embed height
  youtube: 'auto',    // uses aspect-video
}

function MediaBlock({
  title,
  subtitle,
  provider,
  storageKey,
}: {
  title: string
  subtitle?: string
  provider: Provider
  storageKey: keyof ReturnType<typeof getMediaLinks>
}) {
  const links = getMediaLinks()
  const saved = links[storageKey] ?? ''
  const [input, setInput] = useState(saved)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [clearedMessage, setClearedMessage] = useState<string | null>(null)
  const clearMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setInput(saved)
    if (saved) {
      const embed = getEmbedUrl(provider, saved)
      setEmbedUrl(embed)
    } else {
      setEmbedUrl(null)
    }
  }, [saved, provider])

  useEffect(() => {
    return () => {
      if (clearMessageTimeoutRef.current) clearTimeout(clearMessageTimeoutRef.current)
    }
  }, [])

  const showClearedFeedback = () => {
    setClearedMessage(`${getProviderNameForMessage(storageKey)} embed cleared`)
    if (clearMessageTimeoutRef.current) clearTimeout(clearMessageTimeoutRef.current)
    clearMessageTimeoutRef.current = setTimeout(() => {
      setClearedMessage(null)
      clearMessageTimeoutRef.current = null
    }, 2500)
  }

  const handleClear = () => {
    setEmbedUrl(null)
    setInput('')
    setLoadError(null)
    const next = { ...getMediaLinks(), [storageKey]: '' }
    setMediaLinks(next)
    showClearedFeedback()
  }

  const handleLoad = () => {
    const trimmed = input.trim()
    if (!trimmed) {
      handleClear()
      return
    }
    const embed = getEmbedUrl(provider, trimmed)
    if (!embed) {
      setLoadError('Invalid link for this provider.')
      return
    }
    setEmbedUrl(embed)
    setLoadError(null)
    const next = { ...getMediaLinks(), [storageKey]: trimmed }
    setMediaLinks(next)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      <div className="mt-2 flex gap-2">
        <input
          type="url"
          placeholder={`Paste ${title} link...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          aria-label={`${title} URL`}
        />
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={handleLoad}
        >
          Load
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>
      {loadError && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {loadError}
        </p>
      )}
      {clearedMessage && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400" role="status">
          {clearedMessage}
        </p>
      )}
      {embedUrl && saved && (
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Currently loaded: {getLoadedLabel(saved)}{' '}
          <button
            type="button"
            className="text-blue-600 underline hover:no-underline dark:text-blue-400"
            onClick={handleClear}
          >
            Remove
          </button>
        </p>
      )}
      {embedUrl && (
        <div
          className={`mt-4 w-full overflow-hidden rounded-lg bg-slate-900 ${provider === 'youtube' ? 'aspect-video' : ''}`}
          style={provider !== 'youtube' ? { height: EMBED_HEIGHT[provider] } : undefined}
        >
          <iframe
            title={title}
            src={embedUrl}
            className="block h-full w-full border-0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </div>
      )}
    </div>
  )
}

export function MediaView() {
  const location = useLocation()
  const spotifyState = (location.state as { spotifyConnected?: boolean; spotifyError?: boolean }) ?? {}
  const [spotifyMessage, setSpotifyMessage] = useState<string | null>(null)
  const [spotifyEmbedKey, setSpotifyEmbedKey] = useState(0)
  const { isConfigured: spotifyConfigured, isConnected: spotifyConnected, user: spotifyUser, loading: spotifyLoading, error: spotifyError, connect: spotifyConnect, disconnect: spotifyDisconnect, refreshConnection: spotifyRefresh } = useSpotify()

  useEffect(() => {
    if (spotifyState.spotifyConnected) {
      setSpotifyMessage('Connected to Spotify.')
      const t = setTimeout(() => setSpotifyMessage(null), 4000)
      return () => clearTimeout(t)
    }
    if (spotifyState.spotifyError) {
      setSpotifyMessage('Could not connect to Spotify. Try again.')
      const t = setTimeout(() => setSpotifyMessage(null), 5000)
      return () => clearTimeout(t)
    }
  }, [spotifyState.spotifyConnected, spotifyState.spotifyError])

  const handleSetSpotifyEmbed = (url: string) => {
    setMediaLinks({ ...getMediaLinks(), spotify: url })
    setSpotifyEmbedKey((k) => k + 1)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Media Player Hub</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Playback and volume controls are handled by the provider embed.
      </p>

      {spotifyConfigured && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Connect Spotify</h3>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Connect your account to import Liked Songs and playlists into Workspace (metadata only).
          </p>
          {spotifyMessage && (
            <p className={`mt-2 text-sm ${spotifyMessage.includes('Could not') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} role="status">
              {spotifyMessage}
            </p>
          )}
          {spotifyError && (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400" role="alert">
              {spotifyError} You may need to reconnect.
            </p>
          )}
          {!spotifyConnected ? (
            <div className="mt-4">
              {spotifyLoading ? (
                <p className="text-sm text-slate-500">Checking connection…</p>
              ) : (
                <button
                  type="button"
                  className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                  onClick={spotifyConnect}
                >
                  Connect Spotify
                </button>
              )}
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {spotifyUser?.images?.[0]?.url && (
                <img src={spotifyUser.images[0].url} alt="" className="h-10 w-10 rounded-full object-cover" />
              )}
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">
                  {spotifyUser?.display_name ?? 'Spotify user'}
                </p>
                <span className="inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-200">
                  Connected
                </span>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                onClick={() => spotifyRefresh()}
              >
                Refresh
              </button>
              <button
                type="button"
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                onClick={spotifyDisconnect}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      )}

      {spotifyConnected && spotifyConfigured && <SpotifyLibrary onSetEmbedUrl={handleSetSpotifyEmbed} />}

      <SpotifyDualModeCard key={spotifyEmbedKey} />

      <MediaBlock title="YouTube" provider="youtube" storageKey="youtube" />
    </div>
  )
}
