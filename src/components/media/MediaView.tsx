import { useState, useEffect, useRef } from 'react'
import { getMediaLinks, setMediaLinks } from '@/store/storage'
import { SpotifyDualModeCard } from './SpotifyDualModeCard'
import { useMedia } from '@/contexts/MediaContext'

type Provider = 'spotify' | 'youtube'

/**
 * Extracts YouTube video ID from various URL formats
 * Returns null if invalid or missing
 */
function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  
  try {
    // Handle URLs without protocol
    const urlString = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
    const u = new URL(urlString)
    
    // Standard: youtube.com/watch?v=VIDEO_ID
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com' || u.hostname === 'm.youtube.com') {
      const videoId = u.searchParams.get('v')
      if (videoId) return videoId.split('&')[0] // Remove any trailing params
    }
    
    // Short: youtu.be/VIDEO_ID
    if (u.hostname === 'youtu.be') {
      const videoId = u.pathname.slice(1).split('/')[0].split('?')[0]
      if (videoId) return videoId
    }
    
    // Embed: youtube.com/embed/VIDEO_ID
    if ((u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') && u.pathname.startsWith('/embed/')) {
      const videoId = u.pathname.split('/')[2]?.split('?')[0]
      if (videoId) return videoId
    }
  } catch {
    // Invalid URL format
  }
  
  return null
}

/**
 * Builds YouTube embed URL from video ID
 */
function buildYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`
}

function getEmbedUrl(provider: Provider, url: string): string | null {
  try {
    if (provider === 'spotify') {
      const u = new URL(url.trim())
      if (u.hostname.includes('open.spotify.com')) {
        const path = u.pathname + u.search
        return `https://open.spotify.com/embed${path}`
      }
      return null
    }
    if (provider === 'youtube') {
      const videoId = extractYouTubeVideoId(url)
      if (videoId) {
        return buildYouTubeEmbedUrl(videoId)
      }
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
  const { isPopupOpen, setYoutubeVideoId } = useMedia()
  const links = getMediaLinks()
  const saved = links[storageKey] ?? ''
  const [input, setInput] = useState(saved)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [playerError, setPlayerError] = useState<string | null>(null)
  const [clearedMessage, setClearedMessage] = useState<string | null>(null)
  const clearMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    setInput(saved)
    if (saved) {
      const embed = getEmbedUrl(provider, saved)
      setEmbedUrl(embed)
      // Update MediaContext for YouTube
      if (provider === 'youtube' && embed) {
        const videoId = extractYouTubeVideoId(saved)
        setYoutubeVideoId(videoId)
      }
    } else {
      setEmbedUrl(null)
      // Clear MediaContext for YouTube
      if (provider === 'youtube') {
        setYoutubeVideoId(null)
      }
    }
  }, [saved, provider, setYoutubeVideoId])

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
    setPlayerError(null)
    const next = { ...getMediaLinks(), [storageKey]: '' }
    setMediaLinks(next)
    showClearedFeedback()
    // Clear MediaContext for YouTube
    if (provider === 'youtube') {
      setYoutubeVideoId(null)
    }
  }

  /**
   * Sanitize YouTube input: extract first valid URL if multiple exist
   */
  const sanitizeInput = (rawInput: string): string => {
    if (provider !== 'youtube') return rawInput.trim()
    
    const trimmed = rawInput.trim()
    if (!trimmed) return ''
    
    // If input contains multiple URLs (e.g., duplicated), extract the first valid one
    const lines = trimmed.split(/[\s\n]+/)
    for (const line of lines) {
      const videoId = extractYouTubeVideoId(line)
      if (videoId) {
        // Return the canonical URL format
        return `https://www.youtube.com/watch?v=${videoId}`
      }
    }
    
    return trimmed
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    const sanitized = sanitizeInput(rawValue)
    setInput(sanitized)
    setLoadError(null)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    const sanitized = sanitizeInput(pastedText)
    setInput(sanitized)
    setLoadError(null)
  }

  const handleLoad = () => {
    const trimmed = input.trim()
    if (!trimmed) {
      handleClear()
      return
    }
    
    const embed = getEmbedUrl(provider, trimmed)
    if (!embed) {
      if (provider === 'youtube') {
        setLoadError('Invalid YouTube link. Use youtube.com/watch?v=..., youtu.be/..., or youtube.com/embed/... format.')
      } else {
        setLoadError('Invalid link for this provider.')
      }
      return
    }
    
    setEmbedUrl(embed)
    setLoadError(null)
    setPlayerError(null)
    const next = { ...getMediaLinks(), [storageKey]: trimmed }
    setMediaLinks(next)
    
    // Update MediaContext for YouTube
    if (provider === 'youtube') {
      const videoId = extractYouTubeVideoId(trimmed)
      setYoutubeVideoId(videoId)
    }
  }

  // Listen for iframe load errors (YouTube particularly)
  useEffect(() => {
    if (!embedUrl || !iframeRef.current) return

    const handleIframeError = () => {
      if (provider === 'youtube') {
        setPlayerError('YouTube player failed to load. The video may be unavailable or restricted.')
      } else {
        setPlayerError('Player failed to load. Please check the link and try again.')
      }
    }

    const iframe = iframeRef.current
    iframe.addEventListener('error', handleIframeError)

    return () => {
      iframe.removeEventListener('error', handleIframeError)
    }
  }, [embedUrl, provider])

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      <div className="mt-2 flex gap-2">
        <input
          type="url"
          placeholder={`Paste ${title} link...`}
          value={input}
          onChange={handleInputChange}
          onPaste={handlePaste}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          aria-label={`${title} URL`}
          aria-describedby={loadError ? `${storageKey}-error` : undefined}
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
        <p id={`${storageKey}-error`} className="mt-2 text-sm text-red-600 dark:text-red-400" role="alert">
          {loadError}
        </p>
      )}
      {clearedMessage && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400" role="status">
          {clearedMessage}
        </p>
      )}
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Playback continues in the bar below.
      </p>
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
        <>
          {playerError && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
              <p className="text-sm text-amber-800 dark:text-amber-200" role="alert">
                {playerError}
              </p>
            </div>
          )}
          <div
            className={`mt-4 w-full overflow-hidden rounded-lg bg-slate-900 ${provider === 'youtube' ? 'aspect-video' : ''}`}
            style={provider !== 'youtube' ? { height: EMBED_HEIGHT[provider] } : undefined}
          >
            {isPopupOpen ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-slate-400">
                  Playing in pop-up. Close pop-up to resume here.
                </p>
              </div>
            ) : (
              <iframe
                ref={iframeRef}
                title={title}
                src={embedUrl}
                className="block h-full w-full border-0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function MediaView() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Media Player Hub</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Playback and volume controls are handled by the provider embed.
      </p>

      <SpotifyDualModeCard />

      <MediaBlock title="YouTube" provider="youtube" storageKey="youtube" />
    </div>
  )
}
