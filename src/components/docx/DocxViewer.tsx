import { useState, useRef, useEffect, useCallback } from 'react'
import { renderAsync as renderDocx } from 'docx-preview'

interface DocxViewerProps {
  fileId: string
  fileName: string
  contentBase64: string
  size?: number
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

const ZOOM_MIN = 25
const ZOOM_MAX = 400
const ZOOM_STEP = 50
const PRESET_ZOOMS = [80, 100, 125] as const

export function DocxViewer({ contentBase64, fileId: _fileId, size: _size }: DocxViewerProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const styleRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100) // percentage
  const [customZoomInput, setCustomZoomInput] = useState('')
  const [fitToWidth, setFitToWidth] = useState(false)
  const [contentWidth, setContentWidth] = useState<number>(0)
  const [containerWidth, setContainerWidth] = useState<number>(0)

  const effectiveZoom = fitToWidth && containerWidth > 0 && contentWidth > 0
    ? containerWidth / contentWidth
    : zoom / 100

  const renderDoc = useCallback(async () => {
    if (!bodyRef.current || !styleRef.current || !contentBase64) return
    setLoading(true)
    setError(null)
    bodyRef.current.innerHTML = ''
    styleRef.current.innerHTML = ''
    try {
      const buffer = base64ToArrayBuffer(contentBase64)
      await renderDocx(buffer, bodyRef.current, styleRef.current, {
        className: 'docx',
        breakPages: true,
        inWrapper: true,
        ignoreLastRenderedPageBreak: false,
      })
      setLoading(false)
      if (bodyRef.current?.firstElementChild) {
        const w = (bodyRef.current.firstElementChild as HTMLElement).offsetWidth
        setContentWidth(w)
      }
    } catch (e) {
      setLoading(false)
      setError(e instanceof Error ? e.message : 'Failed to render document')
    }
  }, [contentBase64])

  useEffect(() => {
    renderDoc()
  }, [renderDoc])

  useEffect(() => {
    if (!wrapperRef.current) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    ro.observe(wrapperRef.current)
    return () => ro.disconnect()
  }, [])

  const zoomIn = () => {
    setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP))
    setFitToWidth(false)
  }
  const zoomOut = () => {
    setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP))
    setFitToWidth(false)
  }
  const applyCustomZoom = () => {
    const n = Number.parseInt(customZoomInput, 10)
    if (!Number.isNaN(n)) setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, n)))
    setCustomZoomInput('')
  }
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

  if (error) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="text-slate-700 dark:text-slate-300">Failed to render document.</p>
        <p className="text-sm text-slate-500">{error}</p>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={renderDoc}
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col" ref={wrapperRef}>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
        <button type="button" className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600" onClick={zoomOut} aria-label="Zoom out">−</button>
        <button type="button" className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600" onClick={zoomIn} aria-label="Zoom in">+</button>
        {PRESET_ZOOMS.map((z) => (
          <button
            key={z}
            type="button"
            className={`rounded px-2 py-1 text-sm ${zoom === z ? 'bg-blue-100 dark:bg-blue-900/50' : 'border border-slate-300 dark:border-slate-600'}`}
            onClick={() => { setZoom(z); setFitToWidth(false) }}
          >
            {z}%
          </button>
        ))}
        <span className="text-sm text-slate-500 dark:text-slate-400">Custom:</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder={`${zoom}%`}
          value={customZoomInput}
          onChange={(e) => setCustomZoomInput(e.target.value.replace(/\D/g, ''))}
          onBlur={applyCustomZoom}
          onKeyDown={(e) => { if (e.key === 'Enter') applyCustomZoom() }}
          className="w-14 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          aria-label="Custom zoom percentage"
        />
        <span className="text-sm text-slate-500 dark:text-slate-400">%</span>
        <button
          type="button"
          className={`rounded px-2 py-1 text-sm ${fitToWidth ? 'bg-blue-100 dark:bg-blue-900/50' : 'border border-slate-300 dark:border-slate-600'}`}
          onClick={() => setFitToWidth((f) => !f)}
        >
          Fit to width
        </button>
        <button type="button" className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600" onClick={() => window.print()}>
          Print
        </button>
        <span className="ml-2 text-xs text-slate-500">Best-effort DOCX rendering in browser.</span>
      </div>
      <div className="flex-1 overflow-auto bg-slate-300 p-6 dark:bg-slate-600" style={{ minHeight: 400 }}>
        {loading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-slate-600 dark:text-slate-400">Rendering document…</p>
          </div>
        )}
        <div
          className="mx-auto origin-top-left bg-white shadow-lg dark:bg-slate-900"
          style={{
            transform: `scale(${effectiveZoom})`,
            transformOrigin: 'top left',
            minHeight: loading ? 0 : 800,
          }}
        >
          <div ref={styleRef} className="docx-styles" />
          <div ref={bodyRef} className="docx-body" />
        </div>
      </div>
    </div>
  )
}
