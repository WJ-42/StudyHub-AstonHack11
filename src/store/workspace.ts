import { idbGetAll, idbPut, idbDelete, idbGetByIndex, idbGet } from './storage'
import type { WorkspaceFolder, WorkspaceFile, WorkspaceItem } from '@/types/workspace'

const WORKSPACE_STORE = 'workspace'
const DEFAULT_WORKSPACE_ID = 'default'

export async function getAllWorkspaceItems(workspaceId: string): Promise<WorkspaceItem[]> {
  const raw = await idbGetByIndex<WorkspaceItem>(WORKSPACE_STORE, 'workspaceId', workspaceId)
  return raw
}

/** Returns all items (no filter). Used for migration only. */
export async function getAllWorkspaceItemsUnscoped(): Promise<WorkspaceItem[]> {
  return idbGetAll<WorkspaceItem>(WORKSPACE_STORE)
}

export async function getFoldersByParent(workspaceId: string, parentId: string | null): Promise<WorkspaceFolder[]> {
  const all = await getAllWorkspaceItems(workspaceId)
  return all.filter((i): i is WorkspaceFolder => i.kind === 'folder' && i.parentId === parentId)
}

export async function getFilesByFolder(workspaceId: string, folderId: string | null): Promise<WorkspaceFile[]> {
  const all = await getAllWorkspaceItems(workspaceId)
  return all.filter((i): i is WorkspaceFile => i.kind === 'file' && i.folderId === folderId)
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

export async function moveFile(fileId: string, folderId: string | null): Promise<WorkspaceFile | undefined> {
  const item = await idbGet<WorkspaceItem>(WORKSPACE_STORE, fileId)
  if (!item || item.kind !== 'file') return undefined
  const updated: WorkspaceFile = { ...item, folderId, updatedAt: Date.now() }
  await idbPut(WORKSPACE_STORE, updated)
  return updated
}

export async function deleteItem(id: string): Promise<void> {
  await idbDelete(WORKSPACE_STORE, id)
}

/** Delete all items in a workspace (for workspace delete). */
export async function deleteAllItemsInWorkspace(workspaceId: string): Promise<void> {
  const items = await getAllWorkspaceItems(workspaceId)
  for (const item of items) {
    await idbDelete(WORKSPACE_STORE, item.id)
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}

export { DEFAULT_WORKSPACE_ID }
