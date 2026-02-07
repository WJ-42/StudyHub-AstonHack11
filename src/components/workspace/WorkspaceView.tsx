import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { useWorkspace } from '@/hooks/useWorkspace'
import { useTabs } from '@/hooks/useTabs'
import { useSearch } from '@/contexts/SearchContext'
import { getWorkspaceExpandedFolders, setWorkspaceExpandedFolders } from '@/store/storage'
import { WorkspaceTree } from './WorkspaceTree'
import { DocumentEditor } from '@/components/editor/DocumentEditor'
import { DocxViewer } from '@/components/docx/DocxViewer'
import { PdfViewer } from '@/components/pdf/PdfViewer'
import { SpotifyTrackViewer } from './SpotifyTrackViewer'
import { isFile, MAX_DOCX_SIZE, MAX_PDF_SIZE } from '@/types/workspace'

const WORKSPACE_ROOT_ID = 'workspace-root'

export function WorkspaceView() {
  const {
    items,
    createFolder,
    addFile,
    addDocxFile,
    addPdfFile,
    renameItem,
    deleteItem,
    getItem,
    updateFileContent,
    moveFile,
  } = useWorkspace()

  const handleDelete = (id: string, _isFolder: boolean) => {
    if (id === WORKSPACE_ROOT_ID) {
      window.alert('Workspace cannot be removed.')
      return
    }
    deleteItem(id)
  }
  const { openTabIds, activeTabId, openTab, closeTab, setActiveTab } = useTabs()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [importTargetFolderId, setImportTargetFolderId] = useState<string | null>(null)
  const [expandedFolders, setExpandedFoldersState] = useState<Record<string, boolean>>(() => getWorkspaceExpandedFolders())
  const [moveMessage, setMoveMessage] = useState<string | null>(null)
  const [isDragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setWorkspaceExpandedFolders(expandedFolders)
  }, [expandedFolders])

  const handleToggleExpand = useCallback((folderId: string) => {
    setExpandedFoldersState((prev) => ({ ...prev, [folderId]: !prev[folderId] }))
  }, [])

  const handleMoveFeedback = useCallback((message: string) => {
    setMoveMessage(message)
  }, [])
  useEffect(() => {
    if (!moveMessage) return
    const t = setTimeout(() => setMoveMessage(null), 2500)
    return () => clearTimeout(t)
  }, [moveMessage])

  const handleCreateFolder = (parentId: string | null) => {
    const name = window.prompt('Folder name', 'New folder')
    if (name != null) createFolder(parentId, name.trim() || 'New folder')
  }

  const handleImportRequest = (folderId: string | null) => {
    setImportTargetFolderId(folderId)
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    const folderId = importTargetFolderId
    setImportTargetFolderId(null)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const ext = file.name.split('.').pop()?.toLowerCase()
      try {
        if (ext === 'docx') {
          if (file.size > MAX_DOCX_SIZE) {
            window.alert(`"${file.name}" is too large. Maximum size for DOCX files is 5 MB.`)
            continue
          }
          const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const r = new FileReader()
            r.onload = () => resolve(r.result as ArrayBuffer)
            r.onerror = () => reject(r.error)
            r.readAsArrayBuffer(file)
          })
          const bytes = new Uint8Array(buffer)
          const chunkSize = 8192
          let binary = ''
          for (let j = 0; j < bytes.length; j += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(j, j + chunkSize))
          }
          const base64 = btoa(binary)
          const fileId = await addDocxFile(folderId, file.name, base64, file.size)
          openTab(fileId)
        } else if (ext === 'pdf') {
          if (file.size > MAX_PDF_SIZE) {
            window.alert(`"${file.name}" is too large. Maximum size for PDF files is 5 MB.`)
            continue
          }
          const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
            const r = new FileReader()
            r.onload = () => resolve(r.result as ArrayBuffer)
            r.onerror = () => reject(r.error)
            r.readAsArrayBuffer(file)
          })
          const bytes = new Uint8Array(buffer)
          const chunkSize = 8192
          let binary = ''
          for (let j = 0; j < bytes.length; j += chunkSize) {
            binary += String.fromCharCode(...bytes.subarray(j, j + chunkSize))
          }
          const base64 = btoa(binary)
          const fileId = await addPdfFile(folderId, file.name, base64, file.size)
          openTab(fileId)
        } else {
          const text = await new Promise<string>((resolve, reject) => {
            const r = new FileReader()
            r.onload = () => resolve(String(r.result))
            r.onerror = () => reject(r.error)
            r.readAsText(file)
          })
          const fileType = ext === 'csv' ? 'csv' : 'text'
          await addFile(folderId, file.name, fileType, text)
        }
      } catch (err) {
        console.error(err)
        window.alert(`Could not import "${file.name}". Please try again.`)
      }
    }
    e.target.value = ''
  }

  const handleOpenFile = (id: string) => {
    openTab(id)
  }

  const { query } = useSearch()
  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((i) => i.name.toLowerCase().includes(q))
  }, [items, query])

  const activeItem = activeTabId ? getItem(activeTabId) : null
  const hasAnyItems = items.length > 0
  const hasTabs = openTabIds.length > 0

  return (
    <div className="flex h-full gap-4">
      <aside className="flex w-64 flex-col rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-200 p-2 font-medium text-slate-800 dark:border-slate-700 dark:text-slate-100">
          Files &amp; folders
        </div>
        {moveMessage && (
          <div className="border-b border-slate-200 bg-blue-50 px-2 py-1.5 text-sm text-blue-800 dark:border-slate-700 dark:bg-blue-900/30 dark:text-blue-200" role="status">
            {moveMessage}
          </div>
        )}
        <WorkspaceTree
          items={filteredItems}
          selectedFolderId={selectedFolderId}
          expandedFolders={expandedFolders}
          onToggleExpand={handleToggleExpand}
          onSelectFolder={setSelectedFolderId}
          onOpenFile={handleOpenFile}
          onCreateFolder={handleCreateFolder}
          onImportFiles={handleImportRequest}
          onRename={renameItem}
          onDelete={handleDelete}
          moveFile={moveFile}
          getItem={getItem}
          onMoveFeedback={handleMoveFeedback}
          isDragging={isDragging}
          setDragging={setDragging}
        />
      </aside>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        aria-label="Import files"
        onChange={handleFileSelect}
      />

      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {hasTabs && (
          <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
            {openTabIds.map((id) => {
              const item = getItem(id)
              return (
                <div
                  key={id}
                  className={`flex items-center gap-1 border-r border-slate-200 px-3 py-2 text-sm dark:border-slate-700 ${
                    id === activeTabId ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <button
                    type="button"
                    className="min-w-0 truncate max-w-[140px]"
                    onClick={() => setActiveTab(id)}
                  >
                    {item?.name ?? id}
                  </button>
                  <button
                    type="button"
                    className="rounded p-0.5 hover:bg-slate-300 dark:hover:bg-slate-600"
                    onClick={() => closeTab(id)}
                    aria-label="Close tab"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {!hasTabs && !hasAnyItems && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No files yet. Create a folder or import files to get started.
              </p>
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-700"
                onClick={() => handleImportRequest(null)}
              >
                Import files
              </button>
            </div>
          )}
          {!hasTabs && hasAnyItems && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                Click a file in the sidebar to open it in a tab.
              </p>
            </div>
          )}
          {hasTabs && activeItem && isFile(activeItem) && activeItem.fileType === 'docx' && (
            <div className="h-full min-h-[300px]">
              <DocxViewer
                fileId={activeItem.id}
                fileName={activeItem.name}
                contentBase64={activeItem.content}
                size={activeItem.size}
              />
            </div>
          )}
          {hasTabs && activeItem && isFile(activeItem) && activeItem.fileType === 'pdf' && (
            <div className="h-full min-h-[300px]">
              <PdfViewer
                fileId={activeItem.id}
                fileName={activeItem.name}
                contentBase64={activeItem.content}
                size={activeItem.size}
              />
            </div>
          )}
          {hasTabs && activeItem && isFile(activeItem) && activeItem.fileType === 'spotify' && (
            <div className="h-full min-h-[300px]">
              <SpotifyTrackViewer content={activeItem.content} fileName={activeItem.name} />
            </div>
          )}
          {hasTabs && activeItem && isFile(activeItem) && (activeItem.fileType === 'text' || activeItem.fileType === 'csv') && (
            <div className="h-full min-h-[300px]">
              <DocumentEditor
                content={activeItem.content}
                fileType={activeItem.fileType}
                fileName={activeItem.name}
                onSave={(content) => updateFileContent(activeItem.id, content)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
