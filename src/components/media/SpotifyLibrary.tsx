import { useState, useEffect, useCallback } from 'react'
import {
  getPlaylists,
  getPlaylistsNext,
  getSavedTracks,
  getSavedTracksNext,
  getPlaylistTracks,
  getPlaylistTracksNext,
  type SpotifyPlaylist,
  type NormalizedTrack,
  normalizeTrack,
  formatDuration,
} from '@/services/spotifyApi'
import type { SpotifyTrack } from '@/services/spotifyApi'
import type { SpotifyTrackMeta } from '@/types/workspace'
import { useWorkspace } from '@/hooks/useWorkspace'

type View = 'list' | 'liked' | 'playlist'

export function SpotifyLibrary({
  onSetEmbedUrl,
}: {
  onSetEmbedUrl?: (url: string) => void
}) {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [playlistsNext, setPlaylistsNext] = useState<string | null>(null)
  const [playlistsLoading, setPlaylistsLoading] = useState(false)
  const [tracks, setTracks] = useState<NormalizedTrack[]>([])
  const [tracksTotal, setTracksTotal] = useState(0)
  const [tracksNext, setTracksNext] = useState<string | null>(null)
  const [tracksLoading, setTracksLoading] = useState(false)
  const [importProgress, setImportProgress] = useState<string | null>(null)
  const [view, setView] = useState<View>('list')
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const { createFolder, addSpotifyTrackFile } = useWorkspace()

  const loadPlaylists = useCallback(async () => {
    setPlaylistsLoading(true)
    setApiError(null)
    try {
      const res = await getPlaylists()
      setPlaylists(res.items)
      setPlaylistsNext(res.next)
    } catch (e) {
      setPlaylists([])
      setPlaylistsNext(null)
      setApiError(e instanceof Error ? e.message : 'Failed to load playlists. Try reconnecting.')
    } finally {
      setPlaylistsLoading(false)
    }
  }, [])

  const loadMorePlaylists = useCallback(async () => {
    if (!playlistsNext) return
    try {
      const res = await getPlaylistsNext(playlistsNext)
      setPlaylists((p) => [...p, ...res.items])
      setPlaylistsNext(res.next)
    } catch {
      setPlaylistsNext(null)
    }
  }, [playlistsNext])

  useEffect(() => {
    if (view === 'list') loadPlaylists()
  }, [view, loadPlaylists])

  const loadLikedTracks = useCallback(async () => {
    setView('liked')
    setSelectedPlaylist(null)
    setTracks([])
    setTracksTotal(0)
    setTracksNext(null)
    setApiError(null)
    setTracksLoading(true)
    try {
      const res = await getSavedTracks(50, 0)
      const list = res.items.map((i) => normalizeTrack(i.track)).filter(Boolean)
      setTracks(list)
      setTracksTotal(res.total)
      setTracksNext(res.next)
    } catch (e) {
      setTracks([])
      setTracksTotal(0)
      setApiError(e instanceof Error ? e.message : 'Failed to load liked songs.')
    } finally {
      setTracksLoading(false)
    }
  }, [])

  const loadMoreLiked = useCallback(async () => {
    if (!tracksNext || view !== 'liked') return
    try {
      const res = await getSavedTracksNext(tracksNext)
      const list = res.items.map((i) => normalizeTrack(i.track)).filter(Boolean)
      setTracks((t) => [...t, ...list])
      setTracksNext(res.next)
    } catch {
      setTracksNext(null)
    }
  }, [tracksNext, view])

  const loadPlaylistTracks = useCallback(async (playlist: SpotifyPlaylist) => {
    setView('playlist')
    setSelectedPlaylist(playlist)
    setTracks([])
    setTracksTotal(playlist.tracks?.total ?? 0)
    setTracksNext(null)
    setApiError(null)
    setTracksLoading(true)
    try {
      const res = await getPlaylistTracks(playlist.id, 100, 0)
      const list = res.items
        .map((i) => i.track)
        .filter((t): t is SpotifyTrack => t != null)
        .map(normalizeTrack)
      setTracks(list)
      setTracksNext(res.next)
    } catch (e) {
      setTracks([])
      setTracksNext(null)
      setApiError(e instanceof Error ? e.message : 'Failed to load playlist.')
    } finally {
      setTracksLoading(false)
    }
  }, [])

  const loadMorePlaylistTracks = useCallback(async () => {
    if (!tracksNext || view !== 'playlist') return
    try {
      const res = await getPlaylistTracksNext(tracksNext)
      const list = res.items
        .map((i) => i.track)
        .filter((t): t is SpotifyTrack => t != null)
        .map(normalizeTrack)
      setTracks((t) => [...t, ...list])
      setTracksNext(res.next)
    } catch {
      setTracksNext(null)
    }
  }, [tracksNext, view])

  const toMeta = (t: NormalizedTrack, playlistId?: string | null, liked?: boolean): SpotifyTrackMeta => ({
    source: 'spotify',
    trackId: t.id,
    trackUrl: t.url,
    name: t.name,
    artists: t.artists,
    album: t.album,
    duration_ms: t.duration_ms,
    artworkUrl: t.artworkUrl,
    playlistId: playlistId ?? null,
    liked: liked ?? false,
  })

  const importAsFolder = useCallback(async () => {
    if (tracks.length === 0) return
    const folderName = view === 'liked' ? 'Liked Songs' : selectedPlaylist?.name ?? 'Playlist'
    setImportProgress(`Creating folder and importing ${tracks.length} tracks…`)
    try {
      const folderId = await createFolder(null, folderName)
      const playlistId = view === 'playlist' ? selectedPlaylist?.id : null
      const liked = view === 'liked'
      for (let i = 0; i < tracks.length; i++) {
        const meta = toMeta(tracks[i], playlistId, liked)
        await addSpotifyTrackFile(folderId, meta)
        if (i % 20 === 0) setImportProgress(`Imported ${i + 1} of ${tracks.length}…`)
      }
      setImportProgress(`Imported "${folderName}" to Workspace.`)
      setTimeout(() => setImportProgress(null), 3000)
    } catch (e) {
      setImportProgress(null)
      window.alert(e instanceof Error ? e.message : 'Import failed.')
    }
  }, [tracks, view, selectedPlaylist, createFolder, addSpotifyTrackFile])

  const openInSpotify = (url: string) => {
    window.open(url, '_blank')
  }

  const setAsEmbed = (url: string) => {
    onSetEmbedUrl?.(url)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Spotify Library</h3>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
        Import playlists or Liked Songs as folders in Workspace (metadata only). Use &quot;Open in Spotify&quot; to play.
      </p>

      {apiError && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200" role="alert">
          {apiError}
          <button
            type="button"
            className="ml-2 font-medium underline hover:no-underline"
            onClick={() => {
              setApiError(null)
              if (view === 'list') loadPlaylists()
              else if (view === 'liked') loadLikedTracks()
              else if (selectedPlaylist) loadPlaylistTracks(selectedPlaylist)
            }}
          >
            Retry
          </button>
        </div>
      )}

      {view === 'list' && (
        <>
          <div className="mt-4 space-y-2">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
              onClick={loadLikedTracks}
            >
              <span className="text-2xl" aria-hidden>❤️</span>
              <div>
                <span className="font-medium">Liked Songs</span>
                <p className="text-sm text-slate-500 dark:text-slate-400">Your saved tracks</p>
              </div>
            </button>
            {playlistsLoading && <p className="text-sm text-slate-500">Loading playlists…</p>}
            {playlists.map((p) => (
              <button
                key={p.id}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                onClick={() => loadPlaylistTracks(p)}
              >
                {p.images?.[0]?.url ? (
                  <img src={p.images[0].url} alt="" className="h-12 w-12 rounded object-cover" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded bg-slate-200 text-xl dark:bg-slate-600">📁</span>
                )}
                <div className="min-w-0 flex-1">
                  <span className="font-medium truncate block">{p.name}</span>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {p.tracks?.total ?? 0} tracks · {p.owner?.display_name ?? 'Spotify'}
                  </p>
                </div>
              </button>
            ))}
            {playlistsNext && (
              <button
                type="button"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                onClick={loadMorePlaylists}
              >
                Load more playlists
              </button>
            )}
          </div>
        </>
      )}

      {(view === 'liked' || view === 'playlist') && (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
              onClick={() => setView('list')}
            >
              ← Back
            </button>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {view === 'liked' ? 'Liked Songs' : selectedPlaylist?.name} ({tracksTotal} tracks)
            </span>
            {tracks.length > 0 && (
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                onClick={importAsFolder}
                disabled={!!importProgress}
              >
                {importProgress ? importProgress : 'Import as folder in Workspace'}
              </button>
            )}
          </div>
          {importProgress && importProgress.includes('Imported') && (
            <p className="mt-2 text-sm text-green-600 dark:text-green-400" role="status">{importProgress}</p>
          )}
          {tracksLoading && <p className="mt-2 text-sm text-slate-500">Loading tracks…</p>}
          <ul className="mt-4 max-h-96 overflow-auto space-y-1">
            {tracks.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-2 dark:border-slate-600"
              >
                {t.artworkUrl && (
                  <img src={t.artworkUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800 dark:text-slate-200">{t.name}</p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">{t.artists} · {t.album}</p>
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">{formatDuration(t.duration_ms)}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500"
                    onClick={() => openInSpotify(t.url)}
                  >
                    Open in Spotify
                  </button>
                  {onSetEmbedUrl && (
                    <button
                      type="button"
                      className="rounded bg-slate-200 px-2 py-1 text-xs hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500"
                      onClick={() => setAsEmbed(`https://open.spotify.com/embed/track/${t.id}`)}
                    >
                      Set as preview
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {tracksNext && (
            <button
              type="button"
              className="mt-2 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
              onClick={view === 'liked' ? loadMoreLiked : loadMorePlaylistTracks}
            >
              Load more tracks
            </button>
          )}
        </>
      )}
    </div>
  )
}
