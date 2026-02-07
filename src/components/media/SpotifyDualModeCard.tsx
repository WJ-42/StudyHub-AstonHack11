import { useState, useEffect } from 'react'
import {
  getMediaLinks,
  setMediaLinks,
  getMediaSpotifyYoutubeVideoId,
  setMediaSpotifyYoutubeVideoId,
  removeMediaSpotifyYoutubeVideoId,
  getSpotifyYoutubeCache,
  setSpotifyYoutubeCacheEntry,
} from '@/store/storage'
import { Button } from '@/components/ui/Button'
import { FindOnYouTubeModal } from './FindOnYouTubeModal'
import { normalizeSpotifyTrackUrl, fetchSpotifyOEmbed, buildSearchQueryFromOEmbed } from '@/services/spotifyOEmbed'
import { searchYouTubeVideos, type YouTubeSearchItem } from '@/services/youtubeSearch'

function getSpotifyEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url.trim())
    if (u.hostname.includes('open.spotify.com')) {
      const path = u.pathname + u.search
      return `https://open.spotify.com/embed${path}`
    }
  } catch {
    // ignore
  }
  return null
}

function isSpotifyLink(input: string): boolean {
  const trimmed = input.trim()
  if (!trimmed) return false
  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    return u.hostname.includes('open.spotify.com')
  } catch {
    return false
  }
}

export function SpotifyDualModeCard() {
  const links = getMediaLinks()
  const savedSpotify = links.spotify ?? ''
  const [spotifyInput, setSpotifyInput] = useState(savedSpotify)
  const [spotifyEmbedUrl, setSpotifyEmbedUrl] = useState<string | null>(null)
  const [spotifyError, setSpotifyError] = useState<string | null>(null)
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(() => getMediaSpotifyYoutubeVideoId())
  const [modalOpen, setModalOpen] = useState(false)
  const [initialSearchQuery, setInitialSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<YouTubeSearchItem[] | null>(null)
  const [spotifyTrackUrlForCache, setSpotifyTrackUrlForCache] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showFallbackPaste, setShowFallbackPaste] = useState(false)
  const [cachedVideoId, setCachedVideoId] = useState<string | null>(null)

  useEffect(() => {
    setSpotifyInput(savedSpotify)
    if (savedSpotify) {
      const embed = getSpotifyEmbedUrl(savedSpotify)
      setSpotifyEmbedUrl(embed)
    } else {
      setSpotifyEmbedUrl(null)
    }
  }, [savedSpotify])

  useEffect(() => {
    setYoutubeVideoId(getMediaSpotifyYoutubeVideoId())
  }, [modalOpen])

  const handlePlayPreview = () => {
    const trimmed = spotifyInput.trim()
    if (!trimmed) {
      setSpotifyError('Paste a Spotify link first.')
      return
    }
    if (!isSpotifyLink(trimmed)) {
      setSpotifyError('Invalid Spotify link. Use a link from open.spotify.com (track, album, or playlist).')
      return
    }
    setSpotifyError(null)
    const embed = getSpotifyEmbedUrl(trimmed)
    if (!embed) {
      setSpotifyError('Could not build embed URL.')
      return
    }
    setSpotifyEmbedUrl(embed)
    setMediaLinks({ ...getMediaLinks(), spotify: trimmed })
  }

  const handleClearSpotify = () => {
    setSpotifyInput('')
    setSpotifyEmbedUrl(null)
    setSpotifyError(null)
    setMediaLinks({ ...getMediaLinks(), spotify: '' })
  }

  const handleClearYouTube = () => {
    removeMediaSpotifyYoutubeVideoId()
    setYoutubeVideoId(null)
  }

  const handleClearAll = () => {
    handleClearSpotify()
    handleClearYouTube()
  }

  const handleYouTubeLoaded = (videoId: string) => {
    setMediaSpotifyYoutubeVideoId(videoId)
    setYoutubeVideoId(videoId)
    if (spotifyTrackUrlForCache) {
      setSpotifyYoutubeCacheEntry(spotifyTrackUrlForCache, videoId)
    }
  }

  const handlePlayFullVersion = async () => {
    const url = spotifyInput.trim() || savedSpotify
    if (!url) {
      setSpotifyError('Paste a Spotify link first.')
      return
    }
    if (!isSpotifyLink(url)) {
      setSpotifyError('Invalid Spotify link.')
      return
    }
    setSpotifyError(null)

    const normalized = normalizeSpotifyTrackUrl(url)
    const cache = getSpotifyYoutubeCache()
    const cached = normalized ? cache[normalized] ?? null : null
    setSpotifyTrackUrlForCache(normalized || null)
    setCachedVideoId(cached)

    const apiKey = (import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined) ?? ''
    if (!apiKey.trim()) {
      setErrorMessage('Missing YouTube API key. Add VITE_YOUTUBE_API_KEY to .env and restart dev server.')
      setShowFallbackPaste(true)
      setSearchResults(null)
      setInitialSearchQuery('')
      setModalOpen(true)
      return
    }

    const oEmbed = await fetchSpotifyOEmbed(url)
    if (!oEmbed?.title) {
      setErrorMessage('Could not get track info from Spotify link.')
      setShowFallbackPaste(true)
      setSearchResults(null)
      setInitialSearchQuery('')
      setModalOpen(true)
      return
    }

    const query = buildSearchQueryFromOEmbed(oEmbed.title, oEmbed.author_name)
    setInitialSearchQuery(query)
    let results: YouTubeSearchItem[] = []
    try {
      results = await searchYouTubeVideos(query, apiKey)
    } catch {
      results = []
    }
    if (!results.length) {
      setErrorMessage('No YouTube results. Try pasting a YouTube video URL below.')
      setShowFallbackPaste(true)
      setSearchResults(null)
      setModalOpen(true)
      return
    }
    setErrorMessage(null)
    setShowFallbackPaste(false)
    setSearchResults(results)
    setModalOpen(true)
  }

  const handleSearchAgain = async (query: string) => {
    const apiKey = (import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined) ?? ''
    if (!apiKey.trim()) return
    try {
      const results = await searchYouTubeVideos(query.trim() || initialSearchQuery, apiKey)
      setSearchResults(results)
      setErrorMessage(results.length ? null : 'No results. Try a different query or paste a URL below.')
      setShowFallbackPaste(results.length ? false : true)
    } catch {
      setErrorMessage('Search failed. Try pasting a YouTube video URL below.')
      setShowFallbackPaste(true)
    }
  }

  const handleModalClose = () => {
    setModalOpen(false)
    setSpotifyTrackUrlForCache(null)
    setSearchResults(null)
    setErrorMessage(null)
    setShowFallbackPaste(false)
    setCachedVideoId(null)
  }

  const hasSpotify = !!spotifyEmbedUrl
  const hasYouTube = !!youtubeVideoId

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Spotify + full playback</h3>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
        Spotify embed may be preview-only. Use YouTube for full playback.
      </p>

      <div className="mt-3">
        <label htmlFor="spotify-link-input" className="sr-only">
          Spotify link
        </label>
        <input
          id="spotify-link-input"
          type="url"
          placeholder="Paste Spotify track, album, or playlist link..."
          value={spotifyInput}
          onChange={(e) => { setSpotifyInput(e.target.value); setSpotifyError(null) }}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          aria-describedby={spotifyError ? 'spotify-error' : undefined}
        />
        {spotifyError && (
          <p id="spotify-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {spotifyError}
          </p>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="md"
          className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
          onClick={handlePlayPreview}
        >
          Play preview (Spotify)
        </Button>
        <Button variant="danger" size="md" onClick={handlePlayFullVersion}>
          Play full version (YouTube)
        </Button>
        {(hasSpotify || hasYouTube) && (
          <Button variant="secondary" size="md" onClick={handleClearAll}>
            Clear all
          </Button>
        )}
      </div>

      {hasSpotify && (
        <div className="mt-4">
          <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Preview (Spotify embed)</p>
          <div className="overflow-hidden rounded-lg bg-slate-900" style={{ height: '352px' }}>
            <iframe
              title="Spotify preview"
              src={spotifyEmbedUrl ?? ''}
              className="block h-full w-full border-0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            />
          </div>
          <button
            type="button"
            className="mt-1 text-sm text-slate-500 underline hover:no-underline dark:text-slate-400"
            onClick={handleClearSpotify}
          >
            Clear Spotify preview
          </button>
        </div>
      )}

      {hasYouTube && (
        <div className="mt-4">
          <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Full version (YouTube)</p>
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
            <iframe
              title="YouTube full version"
              src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=0`}
              className="block h-full w-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
          <div className="mt-1 flex flex-wrap gap-2">
            <button
              type="button"
              className="text-sm text-slate-500 underline hover:no-underline dark:text-slate-400"
              onClick={handleClearYouTube}
            >
              Clear YouTube
            </button>
            <button
              type="button"
              className="text-sm text-slate-500 underline hover:no-underline dark:text-slate-400"
              onClick={handlePlayFullVersion}
            >
              Change video
            </button>
            <a
              href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-500 underline hover:no-underline dark:text-slate-400"
            >
              Open on YouTube
            </a>
          </div>
        </div>
      )}

      <FindOnYouTubeModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onLoaded={handleYouTubeLoaded}
        initialSearchQuery={initialSearchQuery}
        searchResults={searchResults}
        errorMessage={errorMessage}
        showFallbackPaste={showFallbackPaste}
        cachedVideoId={cachedVideoId}
        onSearchAgain={handleSearchAgain}
      />
    </div>
  )
}
