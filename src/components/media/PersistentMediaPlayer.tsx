import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMedia } from '@/contexts/MediaContext'
import { notifyPopoutOpened } from '@/utils/playerSync'

function getPopoutUrl(embedUrl: string, provider: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  const title = provider === 'youtube' ? 'YouTube' : 'Spotify'
  return `${base}/popout-player.html?url=${encodeURIComponent(embedUrl)}&title=${encodeURIComponent(title)}`
}

function getSpotifyEmbedUrl(url: string): string | null {
  if (!url.trim()) return null
  try {
    const u = new URL(url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`)
    if (u.hostname.includes('open.spotify.com')) {
      return `https://open.spotify.com/embed${u.pathname}${u.search}`
    }
  } catch {
    // ignore
  }
  return null
}

export function PersistentMediaPlayer() {
  const { spotifyUrl, youtubeVideoId, trackMetadata, playerOwner } = useMedia()
  const [isExpanded, setIsExpanded] = useState(true)

  const hasYouTube = !!youtubeVideoId
  const spotifyEmbed = getSpotifyEmbedUrl(spotifyUrl)
  const hasSpotify = !!spotifyEmbed

  if (!hasYouTube && !hasSpotify) {
    return null
  }

  const embedUrl = hasYouTube
    ? `https://www.youtube.com/embed/${youtubeVideoId}`
    : spotifyEmbed!
  const provider = hasYouTube ? 'youtube' : 'spotify'
  const title = hasYouTube ? 'YouTube' : 'Spotify'

  const handlePopOut = () => {
    // Adjust window size based on provider
    const w = provider === 'youtube' ? 640 : 420
    const h = provider === 'youtube' ? 390 : 320
    const left = Math.max(0, (window.screen.width - w) / 2)
    const top = Math.max(0, (window.screen.height - h) / 2)
    window.open(
      getPopoutUrl(embedUrl, provider),
      'popout-player',
      `width=${w},height=${h},left=${left},top=${top},scrollbars=no`
    )
    // Notify that pop-out has been opened
    notifyPopoutOpened()
  }

  const popOutTooltip =
    provider === 'youtube'
      ? 'YouTube embed PiP is limited in browsers. Pop out opens a floating player window.'
      : 'Pop out opens a floating player window.'

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200/60 bg-white/90 shadow-2xl backdrop-blur-md transition-all duration-300 ease-in-out dark:border-slate-700/60 dark:bg-slate-800/90 ${
        isExpanded ? '' : ''
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex-shrink-0 text-lg hover:opacity-70 transition-all duration-200 hover:scale-110"
          aria-label={isExpanded ? 'Collapse player' : 'Expand player'}
          title={isExpanded ? 'Collapse player' : 'Expand player'}
        >
          {isExpanded ? '▼' : '▲'}
        </button>
        <div className="min-w-0 flex-1">
          {trackMetadata ? (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                {trackMetadata.title}
              </div>
              {trackMetadata.artist && (
                <div className="truncate text-xs text-slate-600 dark:text-slate-400">
                  {trackMetadata.artist}
                </div>
              )}
            </div>
          ) : (
            <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
              {title}
            </span>
          )}
        </div>
        {/* Only show pop-out and open buttons when collapsed OR when not showing in expanded area */}
        {(!isExpanded || playerOwner === 'popout') && (
          <>
            <button
              type="button"
              onClick={handlePopOut}
              title={popOutTooltip}
              className="flex-shrink-0 rounded-lg border border-slate-300/60 bg-white/60 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-white hover:shadow-md transition-all hover:scale-105 dark:border-slate-600/60 dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-600/80"
            >
              Pop out
            </button>
            <Link
              to="/app/media"
              className="flex-shrink-0 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-105 dark:from-blue-500 dark:to-blue-600"
            >
              Open
            </Link>
          </>
        )}
        {isExpanded && playerOwner !== 'popout' && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePopOut}
              title={popOutTooltip}
              className="flex-shrink-0 rounded-lg border border-slate-300/60 bg-white/60 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-white hover:shadow-md transition-all hover:scale-105 dark:border-slate-600/60 dark:bg-slate-700/60 dark:text-slate-300 dark:hover:bg-slate-600/80"
            >
              Pop out
            </button>
            <Link
              to="/app/media"
              className="flex-shrink-0 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-105 dark:from-blue-500 dark:to-blue-600"
            >
              Open
            </Link>
          </div>
        )}
      </div>
      <div 
        className={`border-t border-slate-200/60 p-4 dark:border-slate-700/60 transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 p-0 border-0'
        }`}
      >
        {playerOwner === 'popout' ? (
          <div className="flex items-center justify-center rounded-xl bg-slate-100/60 px-4 py-8 dark:bg-slate-700/60">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Playing in pop-out window
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            {trackMetadata?.artwork && (
              <img 
                src={trackMetadata.artwork} 
                alt="Album artwork"
                className="h-24 w-24 flex-shrink-0 rounded-xl shadow-lg"
              />
            )}
            <div 
              className="min-w-0 flex-1 overflow-hidden rounded-xl bg-slate-900 shadow-xl"
              style={{ 
                width: '100%',
                maxWidth: provider === 'spotify' ? '400px' : '560px',
                height: provider === 'spotify' ? '152px' : '315px',
              }}
            >
              <iframe
                title={`${title} player`}
                src={embedUrl}
                className="block h-full w-full border-0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
