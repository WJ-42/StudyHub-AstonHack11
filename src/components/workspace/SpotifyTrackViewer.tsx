import type { SpotifyTrackMeta } from '@/types/workspace'

interface SpotifyTrackViewerProps {
  content: string
  fileName: string
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}:${(s % 60).toString().padStart(2, '0')}`
}

export function SpotifyTrackViewer({ content, fileName }: SpotifyTrackViewerProps) {
  let meta: SpotifyTrackMeta
  try {
    meta = JSON.parse(content) as SpotifyTrackMeta
  } catch {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">Invalid Spotify track data.</p>
      </div>
    )
  }

  if (meta.source !== 'spotify') {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-800">
        <p className="text-sm text-slate-600 dark:text-slate-400">Not a Spotify track.</p>
      </div>
    )
  }

  const url = meta.trackUrl ?? `https://open.spotify.com/track/${meta.trackId}`

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-start gap-4">
        {meta.artworkUrl && (
          <img
            src={meta.artworkUrl}
            alt=""
            className="h-32 w-32 shrink-0 rounded-lg object-cover shadow"
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{meta.name || fileName}</h3>
          {meta.artists && <p className="mt-1 text-slate-600 dark:text-slate-300">{meta.artists}</p>}
          {meta.album && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Album: {meta.album}</p>}
          {meta.duration_ms != null && (
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{formatDuration(meta.duration_ms)}</p>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Open in Spotify
          </a>
        </div>
      </div>
    </div>
  )
}
