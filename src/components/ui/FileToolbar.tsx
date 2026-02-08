import { Button } from './Button'

interface FileToolbarProps {
  fileName: string
  hasUnsavedChanges: boolean
  onSave?: () => void
  onDownload?: () => void
  onDownloadWithNotes?: () => void
  onDownloadNotes?: () => void
  canSave?: boolean
}

export function FileToolbar({
  fileName,
  hasUnsavedChanges,
  onSave,
  onDownload,
  onDownloadWithNotes,
  onDownloadNotes,
  canSave = true,
}: FileToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/50">
      <span className="truncate text-sm font-medium text-slate-700 dark:text-slate-300" title={fileName}>
        {fileName}
      </span>
      {hasUnsavedChanges ? (
        <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>
      ) : (
        <span className="text-xs text-slate-500 dark:text-slate-400">Saved</span>
      )}
      {canSave && onSave && (
        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={!hasUnsavedChanges}
        >
          Save
        </Button>
      )}
      {onDownload && (
        <Button variant="secondary" size="sm" onClick={onDownload}>
          Download
        </Button>
      )}
      {onDownloadWithNotes && (
        <Button variant="secondary" size="sm" onClick={onDownloadWithNotes}>
          Download with notes
        </Button>
      )}
      {onDownloadNotes && (
        <Button variant="secondary" size="sm" onClick={onDownloadNotes}>
          Download notes
        </Button>
      )}
    </div>
  )
}
