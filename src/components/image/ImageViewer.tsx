import { useState, useRef, useCallback, useEffect } from 'react'

interface ImageViewerProps {
  fileId: string
  fileName: string
  contentBase64: string
  size?: number
}

const ZOOM_MIN = 25
const ZOOM_MAX = 400
const ZOOM_STEP = 50
const PRESET_ZOOMS = [80, 100, 125, 150, 200] as const

function base64ToBlobUrl(base64: string, mime: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: mime })
  return URL.createObjectURL(blob)
}

function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'png': return 'image/png'
    case 'jpg':
    case 'jpeg': return 'image/jpeg'
    case 'gif': return 'image/gif'
    case 'webp': return 'image/webp'
    default: return 'image/png'
  }
}

export function ImageViewer({ contentBase64, fileId: _fileId, fileName, size: _size }: ImageViewerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [blobUrl] = useState<string>(() => base64ToBlobUrl(contentBase64, getMimeType(fileName)))
  const [zoom, setZoom] = useState(100) // percentage
  const [customZoomInput, setCustomZoomInput] = useState('')
  const [fitToWidth, setFitToWidth] = useState(false)
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null)

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))
    setFitToWidth(false)
  }, [])
  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))
    setFitToWidth(false)
  }, [])
  const applyCustomZoom = useCallback(() => {
    const n = Number.parseInt(customZoomInput, 10)
    if (!Number.isNaN(n)) setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, n)))
    setCustomZoomInput('')
  }, [customZoomInput])
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey) return
    e.preventDefault()
    setZoom((z) => (e.deltaY < 0 ? Math.min(ZOOM_MAX, z + ZOOM_STEP) : Math.max(ZOOM_MIN, z - ZOOM_STEP)))
    setFitToWidth(false)
  }, [])
  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const handleDownload = useCallback(() => {
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = fileName
    a.click()
  }, [blobUrl, fileName])

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setImageNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
  }, [])

  const currentZoomLevel = fitToWidth ? 'Fit Width' : `${zoom}%`

  return (
    <div className="flex h-full flex-col" ref={wrapperRef}>
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Zoom:</span>
          <button type="button" className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600" onClick={zoomOut} aria-label="Zoom out">−</button>
          <button type="button" className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600" onClick={zoomIn} aria-label="Zoom in">+</button>
          <div className="flex gap-1">
            {PRESET_ZOOMS.map((z) => (
              <button
                key={z}
                type="button"
                onClick={() => {
                  setZoom(z)
                  setFitToWidth(false)
                }}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                  zoom === z && !fitToWidth
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {z}%
              </button>
            ))}
            <span className="text-xs text-slate-500 dark:text-slate-400 self-center">Custom:</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder={`${zoom}`}
              value={customZoomInput}
              onChange={(e) => setCustomZoomInput(e.target.value.replace(/\D/g, ''))}
              onBlur={applyCustomZoom}
              onKeyDown={(e) => { if (e.key === 'Enter') applyCustomZoom() }}
              className="w-10 rounded border border-slate-300 px-1.5 py-0.5 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
              aria-label="Custom zoom percentage"
            />
            <span className="text-xs text-slate-500 dark:text-slate-400 self-center">%</span>
            <button
              type="button"
              onClick={() => setFitToWidth(!fitToWidth)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                fitToWidth
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              Fit
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="rounded bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
          >
            Download
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative flex-1 overflow-auto bg-slate-100 dark:bg-slate-800"
      >
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative"
            style={fitToWidth && imageNaturalSize ? { width: '100%' } : { width: `${zoom}%` }}
          >
            <img
              ref={imageRef}
              src={blobUrl}
              alt={fileName}
              className="w-full shadow-lg"
              onLoad={handleImageLoad}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        {currentZoomLevel}
        {imageNaturalSize && ` • ${imageNaturalSize.width}×${imageNaturalSize.height}px`}
      </div>
    </div>
  )
}
