import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import type { YouTubeSearchItem } from '@/services/youtubeSearch'

export interface FindOnYouTubeModalProps {
  isOpen: boolean
  onClose: () => void
  onLoaded: (videoId: string) => void
  /** Pre-filled search query (from Spotify oEmbed). */
  initialSearchQuery?: string
  /** Search results from YouTube API; when set and length > 0, show results list (default view). */
  searchResults?: YouTubeSearchItem[] | null
  /** When set, show this message and reveal fallback paste UI. */
  errorMessage?: string | null
  /** When true, show manual "Paste YouTube video URL" section (fallback only). */
  showFallbackPaste?: boolean
  /** When set, show "Use previous match" that loads this videoId. */
  cachedVideoId?: string | null
  /** Called when user clicks "Search again" with the current query. */
  onSearchAgain?: (query: string) => void
}

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

export function FindOnYouTubeModal({
  isOpen,
  onClose,
  onLoaded,
  initialSearchQuery = '',
  searchResults = null,
  errorMessage = null,
  showFallbackPaste = false,
  cachedVideoId = null,
  onSearchAgain,
}: FindOnYouTubeModalProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) setSearchQuery(initialSearchQuery)
  }, [isOpen, initialSearchQuery])

  if (!isOpen) return null

  const hasResults = !!(searchResults && searchResults.length > 0)

  const handleSelect = (videoId: string) => {
    onLoaded(videoId)
    onClose()
  }

  const handleSearchAgainClick = () => {
    onSearchAgain?.(searchQuery)
  }

  const handleLoadYouTube = () => {
    setUrlError(null)
    const videoId = extractYouTubeVideoId(youtubeUrl)
    if (!videoId) {
      setUrlError('Invalid YouTube link. Use youtube.com/watch?v=..., youtu.be/..., or youtube.com/embed/... format.')
      return
    }
    onLoaded(videoId)
    onClose()
    setYoutubeUrl('')
  }

  const handleClose = () => {
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
          {hasResults ? 'Choose a video to play the full version.' : showFallbackPaste ? 'Paste a YouTube video URL below.' : 'Searching…'}
        </p>

        {hasResults && (
          <>
            {cachedVideoId && (
              <div className="mt-3">
                <Button variant="secondary" size="sm" onClick={() => handleSelect(cachedVideoId)}>
                  Use previous match
                </Button>
              </div>
            )}
            <div className="mt-3">
              <label htmlFor="youtube-search-query" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Search query
              </label>
              <input
                id="youtube-search-query"
                type="text"
                placeholder="e.g. Artist - Track name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              />
              {onSearchAgain && (
                <Button variant="primary" size="sm" className="mt-2" onClick={handleSearchAgainClick}>
                  Search again
                </Button>
              )}
            </div>
            <ul className="mt-4 max-h-64 space-y-2 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600">
              {searchResults!.map((v) => (
                <li key={v.videoId}>
                  <div
                    role="button"
                    className="flex cursor-pointer select-none items-center gap-3 rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => handleSelect(v.videoId)}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter' || e.key === ' ') { 
                        e.preventDefault()
                        handleSelect(v.videoId)
                      }
                    }}
                  >
                    {v.thumbnailUrl && (
                      <img src={v.thumbnailUrl} alt="" className="h-14 w-24 flex-shrink-0 rounded object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{v.title}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{v.channelTitle}</p>
                    </div>
                    <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); handleSelect(v.videoId) }}>
                      Select
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}

        {showFallbackPaste && (
          <>
            {errorMessage && (
              <p className="mt-4 text-sm text-amber-600 dark:text-amber-400" role="alert">
                {errorMessage}
              </p>
            )}
            <div className="mt-4">
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
              <Button variant="primary" size="md" className="mt-2" onClick={handleLoadYouTube}>
                Load YouTube
              </Button>
            </div>
          </>
        )}

        {!hasResults && !showFallbackPaste && (
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading…</p>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
