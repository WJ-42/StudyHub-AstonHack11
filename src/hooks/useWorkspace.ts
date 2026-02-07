import { useState, useEffect, useCallback } from 'react'
import * as workspaceStore from '@/store/workspace'
import type { WorkspaceItem, WorkspaceFolder, WorkspaceFile, SpotifyTrackMeta } from '@/types/workspace'

export function useWorkspace() {
  const [items, setItems] = useState<WorkspaceItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const all = await workspaceStore.getAllWorkspaceItems()
    setItems(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const createFolder = useCallback(async (parentId: string | null, name: string) => {
    const folder: WorkspaceFolder = {
      id: workspaceStore.generateId(),
      kind: 'folder',
      name: name || 'New folder',
      parentId,
      createdAt: Date.now(),
    }
    await workspaceStore.saveFolder(folder)
    await load()
    return folder.id
  }, [load])

  const addFile = useCallback(async (folderId: string | null, name: string, fileType: 'text' | 'csv', content: string) => {
    const file: WorkspaceFile = {
      id: workspaceStore.generateId(),
      kind: 'file',
      folderId,
      name,
      fileType,
      content,
      createdAt: Date.now(),
    }
    await workspaceStore.saveFile(file)
    await load()
    return file.id
  }, [load])

  const addDocxFile = useCallback(async (folderId: string | null, name: string, contentBase64: string, size: number) => {
    const now = Date.now()
    const file: WorkspaceFile = {
      id: workspaceStore.generateId(),
      kind: 'file',
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
  }, [load])

  const addPdfFile = useCallback(async (folderId: string | null, name: string, contentBase64: string, size: number) => {
    const now = Date.now()
    const file: WorkspaceFile = {
      id: workspaceStore.generateId(),
      kind: 'file',
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
  }, [load])

  const addSpotifyTrackFile = useCallback(async (folderId: string | null, meta: SpotifyTrackMeta): Promise<string> => {
    const name = meta.name && meta.artists ? `${meta.name} – ${meta.artists}` : meta.name || 'Spotify track'
    const file: WorkspaceFile = {
      id: workspaceStore.generateId(),
      kind: 'file',
      folderId,
      name,
      fileType: 'spotify',
      content: JSON.stringify(meta),
      createdAt: Date.now(),
    }
    await workspaceStore.saveFile(file)
    await load()
    return file.id
  }, [load])

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

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    const item = await workspaceStore.getItem(id)
    if (!item) return
    if (item.kind === 'folder') {
      const all = await workspaceStore.getAllWorkspaceItems()
      const toDelete = new Set<string>()
      const collect = (folderId: string) => {
        toDelete.add(folderId)
        all.filter((i) => (i.kind === 'folder' ? i.parentId === folderId : i.folderId === folderId)).forEach((i) => {
          if (i.kind === 'folder') collect(i.id)
          else toDelete.add(i.id)
        })
      }
      collect(id)
      for (const delId of toDelete) {
        await workspaceStore.deleteItem(delId)
      }
    } else {
      await workspaceStore.deleteItem(id)
    }
    await load()
  }, [load])

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
    addSpotifyTrackFile,
    renameItem,
    deleteItem,
    getItem,
    updateFileContent,
    moveFile,
  }
}
