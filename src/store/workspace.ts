import { idbGetAll, idbPut, idbDelete, idbGetByIndex, idbGet } from './storage'
import type { WorkspaceFolder, WorkspaceFile, WorkspaceItem } from '@/types/workspace'

const WORKSPACE_STORE = 'workspace'

export async function getAllWorkspaceItems(): Promise<WorkspaceItem[]> {
  const raw = await idbGetAll<WorkspaceItem>(WORKSPACE_STORE)
  return raw
}

export async function getFoldersByParent(parentId: string | null): Promise<WorkspaceFolder[]> {
  const raw = await idbGetByIndex<WorkspaceFolder>(WORKSPACE_STORE, 'parentId', parentId)
  return raw
}

export async function getFilesByFolder(folderId: string | null): Promise<WorkspaceFile[]> {
  const raw = await idbGetByIndex<WorkspaceFile>(WORKSPACE_STORE, 'folderId', folderId)
  return raw
}

export async function getItem(id: string): Promise<WorkspaceItem | undefined> {
  return idbGet<WorkspaceItem>(WORKSPACE_STORE, id)
}

export async function saveFolder(folder: WorkspaceFolder): Promise<void> {
  await idbPut(WORKSPACE_STORE, folder)
}

export async function saveFile(file: WorkspaceFile): Promise<void> {
  await idbPut(WORKSPACE_STORE, file)
}

export async function updateFileContent(id: string, content: string): Promise<void> {
  const item = await idbGet<WorkspaceItem>(WORKSPACE_STORE, id)
  if (item?.kind === 'file') {
    await idbPut(WORKSPACE_STORE, { ...item, content })
  }
}

export async function deleteItem(id: string): Promise<void> {
  await idbDelete(WORKSPACE_STORE, id)
}

export function generateId(): string {
  return crypto.randomUUID()
}
