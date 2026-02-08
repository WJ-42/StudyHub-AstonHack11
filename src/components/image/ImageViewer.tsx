import { useState, useRef, useCallback } from 'react'

interface ImageViewerProps {
  fileId: string
  fileName: string
  contentBase64: string
  size?: number
}

const ZOOM_LEVELS = [0.8, 1, 1.25, 1.5, 2] as const
type ZoomLevel = (typeof ZOOM_LEVELS)[number]

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
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [blobUrl] = useState<string>(() => base64ToBlobUrl(contentBase64, getMimeType(fileName)))
  const [zoom, setZoom] = useState<ZoomLevel>(1)
  const [fitToWidth, setFitToWidth] = useState(false)
  const [imageNaturalSize, setImageNaturalSize] = useState<{ width: number; height: number } | null>(null)

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

  const currentZoomLevel = fitToWidth ? 'Fit Width' : `${Math.round(zoom * 100)}%`

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Zoom:</span>
          <div className="flex gap-1">
            {ZOOM_LEVELS.map((z) => (
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
                {Math.round(z * 100)}%
              </button>
            ))}
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
            style={fitToWidth && imageNaturalSize ? { width: '100%' } : { width: `${zoom * 100}%` }}
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
