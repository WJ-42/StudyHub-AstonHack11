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
import { useMedia } from '@/contexts/MediaContext'
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
  const { setSpotifyUrl, setYoutubeVideoId: setMediaYoutubeVideoId } = useMedia()
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
    setSpotifyUrl(trimmed)
    
    // Clear YouTube when switching to Spotify preview
    if (youtubeVideoId) {
      handleClearYouTube()
    }
  }

  const handleClearSpotify = () => {
    setSpotifyInput('')
    setSpotifyEmbedUrl(null)
    setSpotifyError(null)
    setMediaLinks({ ...getMediaLinks(), spotify: '' })
    setSpotifyUrl('')
  }

  const handleClearYouTube = () => {
    removeMediaSpotifyYoutubeVideoId()
    setYoutubeVideoId(null)
    setMediaYoutubeVideoId(null)
  }

  const handleClearAll = () => {
    handleClearSpotify()
    handleClearYouTube()
  }

  const handleYouTubeLoaded = (videoId: string) => {
    setMediaSpotifyYoutubeVideoId(videoId)
    setYoutubeVideoId(videoId)
    setMediaYoutubeVideoId(videoId)
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
    
    // Clear Spotify preview when switching to YouTube
    if (spotifyEmbedUrl) {
      handleClearSpotify()
    }
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

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        Playback continues in the bar below.
      </p>

      {/* Inline Spotify Preview Card */}
      {hasSpotify && spotifyEmbedUrl && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Spotify preview loaded</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Playing in bottom bar</p>
              </div>
            </div>
            <button
              type="button"
              className="text-sm text-slate-500 underline hover:no-underline dark:text-slate-400"
              onClick={handleClearSpotify}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Inline YouTube Preview Card */}
      {hasYouTube && youtubeVideoId && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">YouTube full version loaded</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Playing in bottom bar</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-sm text-slate-500 underline hover:no-underline dark:text-slate-400"
                onClick={handlePlayFullVersion}
              >
                Change
              </button>
              <button
                type="button"
                className="text-sm text-slate-500 underline hover:no-underline dark:text-slate-400"
                onClick={handleClearYouTube}
              >
                Clear
              </button>
            </div>
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
