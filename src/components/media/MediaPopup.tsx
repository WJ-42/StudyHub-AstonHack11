import { useEffect, useRef, useState } from 'react'
import { useMedia } from '@/contexts/MediaContext'

interface MediaPopupProps {
  embedUrl: string
  provider: 'youtube' | 'spotify'
  onClose: () => void
}

interface Position {
  x: number
  y: number
}

interface Size {
  width: number
  height: number
}

export function MediaPopup({ embedUrl, provider, onClose }: MediaPopupProps) {
  const { trackMetadata, currentTime, setCurrentTime } = useMedia()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const youtubePlayerRef = useRef<any>(null)
  const playerDivRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  
  // Dragging state
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [position, setPosition] = useState<Position>({ x: window.innerWidth / 2 - 400, y: window.innerHeight / 2 - 300 })
  
  // Resizing state
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>('')
  const [size, setSize] = useState<Size>({ width: 800, height: 600 })

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!popupRef.current) return
    const rect = popupRef.current.getBoundingClientRect()
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        })
      }
      
      if (isResizing && popupRef.current) {
        const rect = popupRef.current.getBoundingClientRect()
        let newWidth = size.width
        let newHeight = size.height
        let newX = position.x
        let newY = position.y

        if (resizeDirection.includes('e')) {
          newWidth = e.clientX - rect.left
        }
        if (resizeDirection.includes('s')) {
          newHeight = e.clientY - rect.top
        }
        if (resizeDirection.includes('w')) {
          newWidth = rect.right - e.clientX
          newX = e.clientX
        }
        if (resizeDirection.includes('n')) {
          newHeight = rect.bottom - e.clientY
          newY = e.clientY
        }

        // Min size constraints
        if (newWidth >= 400 && newHeight >= 300) {
          setSize({ width: newWidth, height: newHeight })
          if (resizeDirection.includes('w') || resizeDirection.includes('n')) {
            setPosition({ x: newX, y: newY })
          }
        }
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setIsResizing(false)
      setResizeDirection('')
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, dragOffset, resizeDirection, size, position])

  // Handle resize start
  const handleResizeStart = (direction: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeDirection(direction)
  }

  // YouTube IFrame API integration for position tracking
  useEffect(() => {
    if (provider !== 'youtube' || !playerDivRef.current) return

    const loadYouTubeAPI = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer()
        return
      }

      // Load YouTube IFrame API if not already loaded
      if (!(window as any).YT) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
        
        // Set up callback for when API is ready
        ;(window as any).onYouTubeIframeAPIReady = () => {
          initPlayer()
        }
      } else {
        // API is loading, wait for it
        setTimeout(loadYouTubeAPI, 100)
      }
    }

    const initPlayer = () => {
      try {
        const url = new URL(embedUrl)
        const videoId = url.pathname.split('/').pop()
        if (!videoId || !playerDivRef.current) return

        youtubePlayerRef.current = new (window as any).YT.Player(playerDivRef.current, {
          videoId,
          playerVars: {
            start: Math.floor(currentTime),
            autoplay: 1,
          },
          events: {
            onReady: (event: any) => {
              if (currentTime > 0) {
                event.target.seekTo(currentTime, true)
                event.target.playVideo()
              }
            },
          },
        })

        // Track current time while playing
        const interval = setInterval(() => {
          if (youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
            try {
              const time = youtubePlayerRef.current.getCurrentTime()
              if (time && time > 0) {
                setCurrentTime(time)
              }
            } catch (e) {
              // Ignore
            }
          }
        }, 1000)

        return () => {
          clearInterval(interval)
          if (youtubePlayerRef.current) {
            try {
              const finalTime = youtubePlayerRef.current.getCurrentTime()
              if (finalTime && finalTime > 0) {
                setCurrentTime(finalTime)
              }
              youtubePlayerRef.current.destroy()
            } catch (e) {
              // Ignore
            }
          }
        }
      } catch (e) {
        console.error('Failed to initialize YouTube player:', e)
      }
    }

    loadYouTubeAPI()
  }, [provider, embedUrl, currentTime, setCurrentTime])

  const title = provider === 'youtube' ? 'YouTube' : 'Spotify'

  return (
    <div 
      ref={popupRef}
      className="fixed rounded-2xl bg-slate-900 shadow-2xl"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        minWidth: '400px',
        minHeight: '300px',
        cursor: isDragging ? 'grabbing' : 'default',
        zIndex: 9999,
      }}
    >
        {/* Resize handles */}
        <div
          className="absolute left-0 top-0 h-3 w-3 cursor-nw-resize"
          onMouseDown={handleResizeStart('nw')}
        />
        <div
          className="absolute right-0 top-0 h-3 w-3 cursor-ne-resize"
          onMouseDown={handleResizeStart('ne')}
        />
        <div
          className="absolute bottom-0 left-0 h-3 w-3 cursor-sw-resize"
          onMouseDown={handleResizeStart('sw')}
        />
        <div
          className="absolute bottom-0 right-0 h-3 w-3 cursor-se-resize"
          onMouseDown={handleResizeStart('se')}
        />
        <div
          className="absolute left-0 top-3 bottom-3 w-2 cursor-w-resize"
          onMouseDown={handleResizeStart('w')}
        />
        <div
          className="absolute right-0 top-3 bottom-3 w-2 cursor-e-resize"
          onMouseDown={handleResizeStart('e')}
        />
        <div
          className="absolute top-0 left-3 right-3 h-2 cursor-n-resize"
          onMouseDown={handleResizeStart('n')}
        />
        <div
          className="absolute bottom-0 left-3 right-3 h-2 cursor-s-resize"
          onMouseDown={handleResizeStart('s')}
        />

        {/* Header - Draggable */}
        <div 
          className="flex items-center justify-between gap-4 border-b border-slate-700 px-6 py-4 cursor-grab active:cursor-grabbing rounded-t-2xl"
          onMouseDown={handleMouseDown}
        >
          <div className="min-w-0 flex-1">
            {trackMetadata ? (
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-slate-100">
                  {trackMetadata.title}
                </h2>
                {trackMetadata.artist && (
                  <p className="truncate text-sm text-slate-400">
                    {trackMetadata.artist}
                  </p>
                )}
              </div>
            ) : (
              <h2 className="text-lg font-semibold text-slate-100">{title} Player</h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex-shrink-0 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:border-slate-500 transition-all"
            aria-label="Close popup"
          >
            Close
          </button>
        </div>

        {/* Player Container */}
        <div className="p-6" style={{ height: 'calc(100% - 72px)' }}>
          <div
            className="overflow-hidden rounded-xl bg-black shadow-2xl h-full"
          >
            {provider === 'youtube' ? (
              <div ref={playerDivRef} className="h-full w-full" />
            ) : (
              <iframe
                ref={iframeRef}
                title={`${title} player`}
                src={embedUrl}
                className="block h-full w-full border-0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              />
            )}
        </div>
      </div>
    </div>
  )
}
