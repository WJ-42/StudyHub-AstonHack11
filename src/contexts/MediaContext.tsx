import { createContext, useCallback, useContext, useState, useEffect } from 'react'
import {
  getMediaLinks,
  setMediaLinks,
  getMediaSpotifyYoutubeVideoId,
  setMediaSpotifyYoutubeVideoId,
  removeMediaSpotifyYoutubeVideoId,
} from '@/store/storage'
import { onPlayerSyncMessage } from '@/utils/playerSync'

export interface TrackMetadata {
  title: string
  artist?: string
  artwork?: string
}

type PlayerOwner = 'main' | 'popout'

interface MediaContextValue {
  spotifyUrl: string
  youtubeVideoId: string | null
  trackMetadata: TrackMetadata | null
  playerOwner: PlayerOwner
  setSpotifyUrl: (url: string) => void
  setYoutubeVideoId: (id: string | null) => void
  setTrackMetadata: (metadata: TrackMetadata | null) => void
  setPlayerOwner: (owner: PlayerOwner) => void
}

const MediaContext = createContext<MediaContextValue | null>(null)

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [spotifyUrl, setSpotifyUrlState] = useState('')
  const [youtubeVideoId, setYoutubeVideoIdState] = useState<string | null>(null)
  const [trackMetadata, setTrackMetadataState] = useState<TrackMetadata | null>(null)
  const [playerOwner, setPlayerOwnerState] = useState<PlayerOwner>('main')

  useEffect(() => {
    const links = getMediaLinks()
    setSpotifyUrlState(links.spotify ?? '')
    setYoutubeVideoIdState(getMediaSpotifyYoutubeVideoId())
  }, [])

  // Listen for player sync messages from pop-out window
  useEffect(() => {
    const unsubscribe = onPlayerSyncMessage((message) => {
      if (message.type === 'popout-opened') {
        setPlayerOwnerState('popout')
      } else if (message.type === 'popout-closed') {
        setPlayerOwnerState('main')
      }
    })
    return unsubscribe
  }, [])

  const setSpotifyUrl = useCallback((url: string) => {
    setSpotifyUrlState(url)
    setMediaLinks({ ...getMediaLinks(), spotify: url })
  }, [])

  const setYoutubeVideoId = useCallback((id: string | null) => {
    setYoutubeVideoIdState(id)
    if (id) setMediaSpotifyYoutubeVideoId(id)
    else removeMediaSpotifyYoutubeVideoId()
  }, [])

  const setTrackMetadata = useCallback((metadata: TrackMetadata | null) => {
    setTrackMetadataState(metadata)
  }, [])

  const setPlayerOwner = useCallback((owner: PlayerOwner) => {
    setPlayerOwnerState(owner)
  }, [])

  return (
    <MediaContext.Provider
      value={{
        spotifyUrl,
        youtubeVideoId,
        trackMetadata,
        playerOwner,
        setSpotifyUrl,
        setYoutubeVideoId,
        setTrackMetadata,
        setPlayerOwner,
      }}
    >
      {children}
    </MediaContext.Provider>
  )
}

export function useMedia() {
  const ctx = useContext(MediaContext)
  if (!ctx) throw new Error('useMedia must be used within MediaProvider')
  return ctx
}
