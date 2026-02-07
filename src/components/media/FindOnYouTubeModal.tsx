import { useState } from 'react'

export interface FindOnYouTubeModalProps {
  isOpen: boolean
  onClose: () => void
  onLoaded: (videoId: string) => void
  /** Optional pre-fill for search query (e.g. from Spotify link); often empty when no API. */
  initialSearchQuery?: string
}

function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null
  try {
    const u = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') {
      const v = u.searchParams.get('v')
      if (v) return v
    }
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      if (id) return id
    }
  } catch {
    // ignore
  }
  return null
}

export function FindOnYouTubeModal({
  isOpen,
  onClose,
  onLoaded,
  initialSearchQuery = '',
}: FindOnYouTubeModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [searchError, setSearchError] = useState<string | null>(null)
  const [urlError, setUrlError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleOpenYouTubeSearch = () => {
    const q = searchQuery.trim()
    if (!q) {
      setSearchError('Enter track title and artist (e.g. Artist - Track name)')
      return
    }
    setSearchError(null)
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, '_blank', 'noopener')
  }

  const handleLoadYouTube = () => {
    setUrlError(null)
    const videoId = extractYouTubeVideoId(youtubeUrl)
    if (!videoId) {
      setUrlError('Invalid YouTube URL. Use a youtube.com/watch?v=... or youtu.be/... link.')
      return
    }
    onLoaded(videoId)
    onClose()
    setYoutubeUrl('')
  }

  const handleClose = () => {
    setSearchError(null)
    setUrlError(null)
    setYoutubeUrl('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="find-youtube-title">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <h2 id="find-youtube-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Find on YouTube
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Search on YouTube, then paste the video URL below to play the full version here.
        </p>

        <div className="mt-4">
          <label htmlFor="youtube-search-query" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Search query
          </label>
          <input
            id="youtube-search-query"
            type="text"
            placeholder="e.g. Artist - Track name"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchError(null) }}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            aria-describedby={searchError ? 'search-error' : undefined}
          />
          {searchError && (
            <p id="search-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {searchError}
            </p>
          )}
          <button
            type="button"
            className="mt-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            onClick={handleOpenYouTubeSearch}
          >
            Open YouTube search
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="youtube-paste-url" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Paste YouTube video URL here
          </label>
          <input
            id="youtube-paste-url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
            value={youtubeUrl}
            onChange={(e) => { setYoutubeUrl(e.target.value); setUrlError(null) }}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            aria-describedby={urlError ? 'url-error' : undefined}
          />
          {urlError && (
            <p id="url-error" className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
              {urlError}
            </p>
          )}
          <button
            type="button"
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            onClick={handleLoadYouTube}
          >
            Load YouTube
          </button>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
