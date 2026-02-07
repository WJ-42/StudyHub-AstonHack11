import { useState, useRef, useEffect } from 'react'
import type { WorkspaceItem, WorkspaceFolder, WorkspaceFile } from '@/types/workspace'
import { isFolder } from '@/types/workspace'

const DRAG_FILE_ID_KEY = 'application/x-workspace-file-id'

interface WorkspaceTreeProps {
  items: WorkspaceItem[]
  selectedFolderId: string | null
  expandedFolders: Record<string, boolean>
  onToggleExpand: (folderId: string) => void
  onSelectFolder: (id: string | null) => void
  onOpenFile: (id: string) => void
  onCreateFolder: (parentId: string | null) => void
  onImportFiles: (folderId: string | null) => void
  onRename: (id: string, newName: string) => void
  onDelete: (id: string, isFolder: boolean) => void
  moveFile: (fileId: string, folderId: string | null) => Promise<boolean>
  getItem: (id: string) => WorkspaceItem | undefined
  onMoveFeedback: (message: string) => void
  isDragging: boolean
  setDragging: (v: boolean) => void
}

function buildTree(items: WorkspaceItem[], parentId: string | null): WorkspaceItem[] {
  const folders = items.filter((i): i is WorkspaceFolder => i.kind === 'folder' && i.parentId === parentId)
  const files = items.filter((i): i is WorkspaceFile => i.kind === 'file' && i.folderId === parentId)
  const sortKey = (f: WorkspaceFile) => f.updatedAt ?? f.createdAt
  return [
    ...folders.sort((a, b) => a.name.localeCompare(b.name)),
    ...files.sort((a, b) => sortKey(a) - sortKey(b)),
  ]
}

function TreeRow({
  item,
  depth,
  onOpenFile,
  onRename,
  onDelete,
  onOpenFolder,
  onToggleExpand,
  selectedFolderId,
  isExpanded,
  isDragging,
  onDragStart,
  onDragEnd,
  isDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  item: WorkspaceItem
  depth: number
  onOpenFile: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string, isFolder: boolean) => void
  onOpenFolder: (id: string | null) => void
  onToggleExpand: (folderId: string) => void
  selectedFolderId: string | null
  isExpanded?: boolean
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: () => void
  isDropTarget?: boolean
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const inputRef = useRef<HTMLInputElement>(null)
  const isF = isFolder(item)
  const isSelected = isF && item.id === selectedFolderId

  const handleSubmit = () => {
    const name = editName.trim()
    if (name) onRename(item.id, name)
    setEditing(false)
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  useEffect(() => {
    setEditName(item.name)
  }, [item.name])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') {
      setEditName(item.name)
      setEditing(false)
    }
  }

  const handleDelete = () => {
    if (isF) {
      if (window.confirm(`Delete folder "${item.name}" and all its contents?`)) onDelete(item.id, true)
    } else {
      if (window.confirm(`Delete file "${item.name}"?`)) onDelete(item.id, false)
    }
  }

  const handleRowClick = () => {
    if (isDragging) return
    if (isF) onOpenFolder(item.id)
    else onOpenFile(item.id)
  }

  const rowContent = (
    <div
      className={`flex items-center gap-1 rounded px-2 py-1.5 text-sm ${isDropTarget ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''} ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onDragOver={isF ? onDragOver : undefined}
      onDragLeave={isF ? onDragLeave : undefined}
      onDrop={isF ? onDrop : undefined}
    >
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          autoFocus
          aria-label="Rename"
        />
      ) : (
        <>
          {isF && (
            <button
              type="button"
              className="flex shrink-0 items-center justify-center rounded p-0.5 hover:bg-slate-300 dark:hover:bg-slate-600"
              onClick={(e) => { e.stopPropagation(); onToggleExpand(item.id) }}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              <span
                className="inline-block transition-transform"
                style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                aria-hidden
              >
                ▶
              </span>
            </button>
          )}
          <button
            type="button"
            className="min-w-0 flex-1 truncate text-left"
            onClick={handleRowClick}
          >
            <span className="mr-1" aria-hidden>{isF ? '📁' : '📄'}</span>
            {item.name}
          </button>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              className="rounded p-0.5 hover:bg-slate-300 dark:hover:bg-slate-600"
              onClick={(e) => { e.stopPropagation(); setEditing(true) }}
              aria-label="Rename"
            >
              ✏️
            </button>
            <button
              type="button"
              className="rounded p-0.5 hover:bg-red-200 dark:hover:bg-red-900/50"
              onClick={(e) => { e.stopPropagation(); handleDelete() }}
              aria-label="Delete"
            >
              🗑️
            </button>
          </div>
        </>
      )}
    </div>
  )

  if (isF) {
    return <div className="group">{rowContent}</div>
  }

  return (
    <div
      className="group cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {rowContent}
    </div>
  )
}

export function WorkspaceTree({
  items,
  selectedFolderId,
  expandedFolders,
  onToggleExpand,
  onSelectFolder,
  onOpenFile,
  onCreateFolder,
  onImportFiles,
  onRename,
  onDelete,
  moveFile,
  getItem,
  onMoveFeedback,
  isDragging,
  setDragging,
}: WorkspaceTreeProps) {
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const rootDropHighlight = dropTargetId === 'root'

  const handleFileDragStart = (e: React.DragEvent, fileId: string) => {
    e.dataTransfer.setData(DRAG_FILE_ID_KEY, fileId)
    e.dataTransfer.effectAllowed = 'move'
    setDragging(true)
  }

  const handleFileDragEnd = () => {
    setDragging(false)
    setDropTargetId(null)
  }

  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetId(folderId)
  }

  const handleFolderDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault()
    const fileId = e.dataTransfer.getData(DRAG_FILE_ID_KEY)
    setDropTargetId(null)
    setDragging(false)
    if (!fileId) return
    const file = getItem(fileId)
    if (!file || file.kind !== 'file' || file.folderId === targetFolderId) return
    const ok = await moveFile(fileId, targetFolderId)
    if (ok) {
      const folder = getItem(targetFolderId)
      onMoveFeedback(`Moved to ${folder?.kind === 'folder' ? folder.name : 'Workspace'}`)
      if (expandedFolders[targetFolderId] === false) onToggleExpand(targetFolderId)
    }
  }

  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetId('root')
  }

  const handleRootDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const fileId = e.dataTransfer.getData(DRAG_FILE_ID_KEY)
    setDropTargetId(null)
    setDragging(false)
    if (!fileId) return
    const file = getItem(fileId)
    if (!file || file.kind !== 'file' || file.folderId === null) return
    const ok = await moveFile(fileId, null)
    if (ok) onMoveFeedback('Moved to Workspace')
  }

  const handleRootDragLeave = () => {
    setDropTargetId(null)
  }

  function renderLevel(parentId: string | null, depth: number): React.ReactNode {
    const levelItems = buildTree(items, parentId)
    return levelItems.map((item) => {
      if (item.kind === 'folder') {
        const isExpanded = expandedFolders[item.id] !== false
        const children = isExpanded ? renderLevel(item.id, depth + 1) : null
        const isDropTarget = dropTargetId === item.id
        return (
          <div key={item.id}>
            <TreeRow
              item={item}
              depth={depth}
              onOpenFile={onOpenFile}
              onRename={onRename}
              onDelete={onDelete}
              onOpenFolder={onSelectFolder}
              onToggleExpand={onToggleExpand}
              selectedFolderId={selectedFolderId}
              isExpanded={isExpanded}
              isDragging={isDragging}
              isDropTarget={isDropTarget}
              onDragOver={(e) => handleFolderDragOver(e, item.id)}
              onDragLeave={() => setDropTargetId(null)}
              onDrop={(e) => handleFolderDrop(e, item.id)}
            />
            {children}
          </div>
        )
      }
      return (
        <TreeRow
          key={item.id}
          item={item}
          depth={depth}
          onOpenFile={onOpenFile}
          onRename={onRename}
          onDelete={onDelete}
          onOpenFolder={onSelectFolder}
          onToggleExpand={onToggleExpand}
          selectedFolderId={selectedFolderId}
          isDragging={isDragging}
          onDragStart={(e) => handleFileDragStart(e, item.id)}
          onDragEnd={handleFileDragEnd}
        />
      )
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2 p-2">
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
          onClick={() => onCreateFolder(selectedFolderId)}
        >
          New folder
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700"
          onClick={() => onImportFiles(selectedFolderId)}
        >
          Import file(s)
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-1">
        <div
          className={`mb-2 rounded px-2 py-1.5 text-sm ${rootDropHighlight ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/30' : ''}`}
          onDragOver={handleRootDragOver}
          onDragLeave={handleRootDragLeave}
          onDrop={handleRootDrop}
        >
          <button
            type="button"
            className="w-full rounded px-2 py-1.5 text-left hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={() => onSelectFolder(null)}
          >
            Workspace
          </button>
        </div>
        {renderLevel(null, 0)}
      </div>
    </div>
  )
}
