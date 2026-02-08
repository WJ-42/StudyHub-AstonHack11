import { useState, useEffect, useCallback } from 'react'
import * as workspaceStore from '@/store/workspace'
import type { WorkspaceItem, WorkspaceFolder, WorkspaceFile, SpotifyTrackMeta } from '@/types/workspace'
import { useActiveWorkspace } from '@/contexts/WorkspaceContext'

export function useWorkspace() {
  const { activeWorkspaceId } = useActiveWorkspace()
  const [items, setItems] = useState<WorkspaceItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const all = await workspaceStore.getAllWorkspaceItems(activeWorkspaceId)
    setItems(all)
    setLoading(false)
  }, [activeWorkspaceId])

  useEffect(() => {
    load()
  }, [load])

  const createFolder = useCallback(async (parentId: string | null, name: string) => {
    console.log('🔵 createFolder called with parentId:', parentId, 'name:', name, 'workspaceId:', activeWorkspaceId)
    const folder: WorkspaceFolder = {
      id: workspaceStore.generateId(),
      kind: 'folder',
      workspaceId: activeWorkspaceId,
      name: name || 'New folder',
      parentId,
      createdAt: Date.now(),
    }
    console.log('🔵 Folder object created:', folder)
    await workspaceStore.saveFolder(folder)
    console.log('🔵 Folder saved to store')
    await load()
    console.log('🔵 Items reloaded')
    return folder.id
  }, [load, activeWorkspaceId])

  const addFile = useCallback(async (folderId: string | null, name: string, fileType: 'text' | 'csv', content: string) => {
    const file: WorkspaceFile = {
      id: workspaceStore.generateId(),
      kind: 'file',
      workspaceId: activeWorkspaceId,
      folderId,
      name,
      fileType,
      content,
      createdAt: Date.now(),
    }
    await workspaceStore.saveFile(file)
    await load()
    return file.id
  }, [load, activeWorkspaceId])

  const addDocxFile = useCallback(async (folderId: string | null, name: string, contentBase64: string, size: number) => {
    const now = Date.now()
    const file: WorkspaceFile = {
      id: workspaceStore.generateId(),
      kind: 'file',
      workspaceId: activeWorkspaceId,
      folderId,
      name,
      fileType: 'docx',
      content: contentBase64,
      createdAt: now,
      size,
      updatedAt: now,
    }
    await workspaceStore.saveFile(file)
    await load()
    return file.id
  }, [load, activeWorkspaceId])

  const addPdfFile = useCallback(async (folderId: string | null, name: string, contentBase64: string, size: number) => {
    const now = Date.now()
    const file: WorkspaceFile = {
      id: workspaceStore.generateId(),
      kind: 'file',
      workspaceId: activeWorkspaceId,
      folderId,
      name,
      fileType: 'pdf',
      content: contentBase64,
      createdAt: now,
      size,
      updatedAt: now,
    }
    await workspaceStore.saveFile(file)
    await load()
    return file.id
  }, [load, activeWorkspaceId])

  const addImageFile = useCallback(async (folderId: string | null, name: string, contentBase64: string, size: number) => {
    const now = Date.now()
    const file: WorkspaceFile = {
      id: workspaceStore.generateId(),
      kind: 'file',
      workspaceId: activeWorkspaceId,
      folderId,
      name,
      fileType: 'image',
      content: contentBase64,
      createdAt: now,
      size,
      updatedAt: now,
    }
    await workspaceStore.saveFile(file)
    await load()
    return file.id
  }, [load, activeWorkspaceId])

  const addSpotifyTrackFile = useCallback(async (folderId: string | null, meta: SpotifyTrackMeta): Promise<string> => {
    const name = meta.name && meta.artists ? `${meta.name} – ${meta.artists}` : meta.name || 'Spotify track'
    const file: WorkspaceFile = {
      id: workspaceStore.generateId(),
      kind: 'file',
      workspaceId: activeWorkspaceId,
      folderId,
      name,
      fileType: 'spotify',
      content: JSON.stringify(meta),
      createdAt: Date.now(),
    }
    await workspaceStore.saveFile(file)
    await load()
    return file.id
  }, [load, activeWorkspaceId])

  const renameItem = useCallback(async (id: string, newName: string) => {
    const item = await workspaceStore.getItem(id)
    if (!item) return
    if (item.kind === 'folder') {
      await workspaceStore.saveFolder({ ...item, name: newName })
    } else {
      await workspaceStore.saveFile({ ...item, name: newName })
    }
    await load()
  }, [load])

  const deleteItem = useCallback(async (id: string): Promise<string[]> => {
    const item = await workspaceStore.getItem(id)
    if (!item) return []
    const toDelete = new Set<string>()
    if (item.kind === 'folder') {
      const all = await workspaceStore.getAllWorkspaceItems(activeWorkspaceId)
      const collect = (folderId: string) => {
        toDelete.add(folderId)
        all.filter((i) => (i.kind === 'folder' ? i.parentId === folderId : i.folderId === folderId)).forEach((i) => {
          if (i.kind === 'folder') collect(i.id)
          else toDelete.add(i.id)
        })
      }
      collect(id)
    } else {
      toDelete.add(id)
    }
    for (const delId of toDelete) {
      await workspaceStore.deleteItem(delId)
    }
    await load()
    return Array.from(toDelete)
  }, [load, activeWorkspaceId])

  const getItem = useCallback((id: string) => items.find((i) => i.id === id), [items])

  const updateFileContent = useCallback(async (id: string, content: string) => {
    await workspaceStore.updateFileContent(id, content)
    await load()
  }, [load])

  const moveFile = useCallback(async (fileId: string, folderId: string | null): Promise<boolean> => {
    const updated = await workspaceStore.moveFile(fileId, folderId)
    if (updated) await load()
    return !!updated
  }, [load])

  return {
    items,
    loading,
    load,
    createFolder,
    addFile,
    addDocxFile,
    addPdfFile,
    addImageFile,
    addSpotifyTrackFile,
    renameItem,
    deleteItem,
    getItem,
    updateFileContent,
    moveFile,
  }
}
