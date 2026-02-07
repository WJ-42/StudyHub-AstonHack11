export type WorkspaceKind = 'folder' | 'file'
export type FileType = 'text' | 'csv' | 'docx'

/** Max size in bytes for DOCX import (5 MB). */
export const MAX_DOCX_SIZE = 5 * 1024 * 1024

export interface WorkspaceFolder {
  id: string
  kind: 'folder'
  name: string
  parentId: string | null
  createdAt: number
}

export interface WorkspaceFile {
  id: string
  kind: 'file'
  folderId: string | null
  name: string
  fileType: FileType
  content: string
  createdAt: number
  /** Byte size of original file (used for docx). */
  size?: number
  /** Timestamp of last update (used for docx). */
  updatedAt?: number
}

export type WorkspaceItem = WorkspaceFolder | WorkspaceFile

export function isFolder(item: WorkspaceItem): item is WorkspaceFolder {
  return item.kind === 'folder'
}

export function isFile(item: WorkspaceItem): item is WorkspaceFile {
  return item.kind === 'file'
}
