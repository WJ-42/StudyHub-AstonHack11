import { useState, useEffect, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

interface DocumentEditorProps {
  content: string
  fileType: 'text' | 'csv'
  fileName: string
  onSave: (content: string) => void
}

const SAVE_DEBOUNCE_MS = 500

export function DocumentEditor({ content: initialContent, fileType, fileName, onSave }: DocumentEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [showPreview, setShowPreview] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setContent(initialContent)
  }, [initialContent])

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      onSave(content)
      saveTimeoutRef.current = null
    }, SAVE_DEBOUNCE_MS)
  }, [content, onSave])

  useEffect(() => {
    if (content === initialContent) return
    scheduleSave()
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [content, initialContent, scheduleSave])

  const handleBlur = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
      onSave(content)
    }
  }

  const isMarkdown = fileName.toLowerCase().endsWith('.md')

  if (fileType === 'csv') {
    return (
      <div className="flex h-full flex-col">
        <p className="mb-2 text-xs text-slate-500">
          Edit CSV here. Use the CSV Visualizer section to view table and charts.
        </p>
        <div className="min-h-0 flex-1">
          <textarea
            className="h-full w-full resize-none rounded border border-slate-200 bg-white p-4 font-mono text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            spellCheck="false"
            aria-label="CSV content"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {isMarkdown && (
        <div className="mb-2 flex gap-2">
          <button
            type="button"
            className={`rounded px-3 py-1.5 text-sm font-medium ${!showPreview ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-slate-200 dark:bg-slate-700'}`}
            onClick={() => setShowPreview(false)}
          >
            Edit
          </button>
          <button
            type="button"
            className={`rounded px-3 py-1.5 text-sm font-medium ${showPreview ? 'bg-blue-100 dark:bg-blue-900/50' : 'bg-slate-200 dark:bg-slate-700'}`}
            onClick={() => setShowPreview(true)}
          >
            Preview
          </button>
        </div>
      )}
      <div className="min-h-0 flex-1">
        {showPreview && isMarkdown ? (
          <div className="prose prose-slate max-w-none rounded border border-slate-200 bg-white p-4 dark:prose-invert dark:border-slate-700 dark:bg-slate-800">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            className="h-full w-full resize-none rounded border border-slate-200 bg-white p-4 font-mono text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onBlur={handleBlur}
            spellCheck="false"
            aria-label="Document content"
          />
        )}
      </div>
    </div>
  )
}
