export type WorkspaceKind = 'folder' | 'file'
export type FileType = 'text' | 'csv' | 'docx' | 'pdf' | 'spotify'

/** Max size in bytes for DOCX import (5 MB). */
export const MAX_DOCX_SIZE = 5 * 1024 * 1024

/** Max size in bytes for PDF import (5 MB). */
export const MAX_PDF_SIZE = 5 * 1024 * 1024

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

/** Metadata stored in workspace files with fileType 'spotify'. */
export interface SpotifyTrackMeta {
  source: 'spotify'
  trackId: string
  trackUrl: string
  name: string
  artists: string
  album: string
  duration_ms?: number
  artworkUrl?: string | null
  playlistId?: string | null
  liked?: boolean
}
