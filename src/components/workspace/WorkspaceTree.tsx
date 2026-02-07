import { useState, useRef, useEffect } from 'react'
import type { WorkspaceItem, WorkspaceFolder, WorkspaceFile } from '@/types/workspace'
import { isFolder } from '@/types/workspace'

interface WorkspaceTreeProps {
  items: WorkspaceItem[]
  selectedFolderId: string | null
  onSelectFolder: (id: string | null) => void
  onOpenFile: (id: string) => void
  onCreateFolder: (parentId: string | null) => void
  onImportFiles: (folderId: string | null) => void
  onRename: (id: string, newName: string) => void
  onDelete: (id: string, isFolder: boolean) => void
}

function buildTree(items: WorkspaceItem[], parentId: string | null): WorkspaceItem[] {
  const folders = items.filter((i): i is WorkspaceFolder => i.kind === 'folder' && i.parentId === parentId)
  const files = items.filter((i): i is WorkspaceFile => i.kind === 'file' && i.folderId === parentId)
  return [...folders.sort((a, b) => a.name.localeCompare(b.name)), ...files.sort((a, b) => a.name.localeCompare(b.name))]
}

function TreeRow({
  item,
  depth,
  onOpenFile,
  onRename,
  onDelete,
  onOpenFolder,
  selectedFolderId,
}: {
  item: WorkspaceItem
  depth: number
  onOpenFile: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string, isFolder: boolean) => void
  onOpenFolder: (id: string | null) => void
  selectedFolderId: string | null
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

  return (
    <div className="group">
      <div
        className={`flex items-center gap-1 rounded px-2 py-1.5 text-sm ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
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
            <button
              type="button"
              className="min-w-0 flex-1 truncate text-left"
              onClick={() => (isF ? onOpenFolder(item.id) : onOpenFile(item.id))}
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
    </div>
  )
}

export function WorkspaceTree({
  items,
  selectedFolderId,
  onSelectFolder,
  onOpenFile,
  onCreateFolder,
  onImportFiles,
  onRename,
  onDelete,
}: WorkspaceTreeProps) {
  function renderLevel(parentId: string | null, depth: number): React.ReactNode {
    const levelItems = buildTree(items, parentId)
    return levelItems.map((item) => {
      if (item.kind === 'folder') {
        const children = renderLevel(item.id, depth + 1)
        return (
          <div key={item.id}>
            <TreeRow
              item={item}
              depth={depth}
              onOpenFile={onOpenFile}
              onRename={onRename}
              onDelete={onDelete}
              onOpenFolder={onSelectFolder}
              selectedFolderId={selectedFolderId}
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
          selectedFolderId={selectedFolderId}
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
        <div className="mb-2">
          <button
            type="button"
            className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={() => onSelectFolder(null)}
          >
            Root
          </button>
        </div>
        {renderLevel(null, 0)}
      </div>
    </div>
  )
}
