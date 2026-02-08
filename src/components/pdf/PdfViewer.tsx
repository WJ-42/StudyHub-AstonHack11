import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Link } from 'react-router-dom'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

// Worker from same pdfjs-dist package (Vite bundles it; version must match API)
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
const workerSrc = typeof pdfjsWorkerUrl === 'string' ? pdfjsWorkerUrl : ''
if (workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
}
if (import.meta.env.DEV) {
  const v = (pdfjs as { version?: string }).version
  console.debug('[PdfViewer] pdfjs version:', v, 'workerSrc:', workerSrc ? 'set' : 'missing')
}

interface PdfViewerProps {
  fileId: string
  fileName: string
  contentBase64: string
  size?: number
}

const ZOOM_LEVELS = [0.8, 1, 1.25] as const
type ZoomLevel = (typeof ZOOM_LEVELS)[number]

function base64ToBlobUrl(base64: string, mime: string): string {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const blob = new Blob([bytes], { type: mime })
  return URL.createObjectURL(blob)
}

export function PdfViewer({ contentBase64, fileId: _fileId, size: _size }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState<ZoomLevel>(1)
  const [fitToWidth, setFitToWidth] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  const naturalPageWidthRef = useRef(0)
  const hasCaputuredWidthRef = useRef(false)

  useEffect(() => {
    if (!contentBase64) return
    const url = base64ToBlobUrl(contentBase64, 'application/pdf')
    setBlobUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [contentBase64])

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    setLoading(false)
    setError(null)
  }, [])

  const onDocumentLoadError = useCallback((e: Error) => {
    setLoading(false)
    setError(e?.message ?? 'Failed to load PDF')
  }, [])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setContainerWidth(entry.contentRect.width)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (numPages === 0) return
    const refs = pageRefs.current
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const n = Number((entry.target as HTMLElement).dataset.pageNumber)
            if (!Number.isNaN(n)) setCurrentPage(n)
          }
        })
      },
      { root: containerRef.current, rootMargin: '-20% 0px', threshold: 0 }
    )
    refs.forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [numPages])

  const [naturalPageWidth, setNaturalPageWidth] = useState(0)
  // Account for horizontal padding (p-4 = 16px each side = 32px total)
  const HORIZONTAL_PADDING = 32
  const effectiveScale = fitToWidth && containerWidth > 0 && naturalPageWidth > 0
    ? (containerWidth - HORIZONTAL_PADDING) / naturalPageWidth
    : zoom

  const handleLoadSuccess = useCallback((page: { width: number; originalWidth?: number }) => {
    // Only capture the natural width once - check the ref to prevent recapture
    if (!hasCaputuredWidthRef.current) {
      hasCaputuredWidthRef.current = true
      naturalPageWidthRef.current = page.width
      setNaturalPageWidth(page.width)
    }
  }, [])

  const zoomIn = () => {
    const idx = ZOOM_LEVELS.indexOf(zoom)
    if (idx < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[idx + 1])
    setFitToWidth(false)
  }
  const zoomOut = () => {
    const idx = ZOOM_LEVELS.indexOf(zoom)
    if (idx > 0) setZoom(ZOOM_LEVELS[idx - 1])
    setFitToWidth(false)
  }

  const retry = () => {
    setError(null)
    setLoading(true)
    setNumPages(0)
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return base64ToBlobUrl(contentBase64, 'application/pdf')
    })
  }

  if (error) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="text-slate-700 dark:text-slate-300">Failed to load PDF.</p>
        <p className="text-sm text-slate-500">{error}</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            onClick={retry}
            aria-label="Retry loading PDF"
          >
            Retry
          </button>
          <Link
            to="/app/workspace"
            className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600"
          >
            Back to Workspace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col" ref={containerRef}>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-700">
        <button type="button" className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600" onClick={zoomOut} aria-label="Zoom out">−</button>
        <button type="button" className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600" onClick={zoomIn} aria-label="Zoom in">+</button>
        {ZOOM_LEVELS.map((z) => (
          <button
            key={z}
            type="button"
            className={`rounded px-2 py-1 text-sm ${zoom === z ? 'bg-blue-100 dark:bg-blue-900/50' : 'border border-slate-300 dark:border-slate-600'}`}
            onClick={() => { setZoom(z); setFitToWidth(false) }}
            aria-label={`Zoom ${Math.round(z * 100)}%`}
          >
            {Math.round(z * 100)}%
          </button>
        ))}
        <button
          type="button"
          className={`rounded px-2 py-1 text-sm ${fitToWidth ? 'bg-blue-100 dark:bg-blue-900/50' : 'border border-slate-300 dark:border-slate-600'}`}
          onClick={() => setFitToWidth((f) => !f)}
          aria-label="Fit to width"
        >
          Fit to width
        </button>
        {numPages > 0 && (
          <span className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
            Page {currentPage} of {numPages}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto bg-slate-300 p-4 dark:bg-slate-600" style={{ minHeight: 400 }}>
        {loading && (
          <div className="flex items-center justify-center py-16">
            <p className="text-slate-600 dark:text-slate-400">Loading PDF…</p>
          </div>
        )}
        {blobUrl && (
          <Document
            file={blobUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="flex flex-col items-center gap-4"
          >
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
              <div
                key={pageNum}
                className="relative bg-white shadow-lg dark:bg-slate-900"
                ref={(el) => { pageRefs.current[pageNum - 1] = el }}
                data-page-number={pageNum}
              >
                <Page
                  pageNumber={pageNum}
                  scale={effectiveScale}
                  onLoadSuccess={pageNum === 1 ? handleLoadSuccess : undefined}
                  renderTextLayer
                  renderAnnotationLayer
                />
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  )
}
