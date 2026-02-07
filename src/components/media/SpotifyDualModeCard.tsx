import { useState, useEffect } from 'react'
import {
  getMediaLinks,
  setMediaLinks,
  getMediaSpotifyYoutubeVideoId,
  setMediaSpotifyYoutubeVideoId,
  removeMediaSpotifyYoutubeVideoId,
} from '@/store/storage'
import { FindOnYouTubeModal } from './FindOnYouTubeModal'

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
        <button
          type="button"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          onClick={handlePlayPreview}
        >
          Play preview (Spotify)
        </button>
        <button
          type="button"
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          onClick={() => setModalOpen(true)}
        >
          Play full version (YouTube)
        </button>
        {(hasSpotify || hasYouTube) && (
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
            onClick={handleClearAll}
          >
            Clear all
          </button>
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
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              className="text-sm text-slate-500 underline hover:no-underline dark:text-slate-400"
              onClick={handleClearYouTube}
            >
              Clear YouTube
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
        onClose={() => setModalOpen(false)}
        onLoaded={handleYouTubeLoaded}
        initialSearchQuery=""
      />
    </div>
  )
}
