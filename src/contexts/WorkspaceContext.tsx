import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  getWorkspaceList,
  setWorkspaceList,
  getActiveWorkspaceId,
  setActiveWorkspaceId as persistActiveWorkspaceId,
  type WorkspaceMeta,
} from '@/store/storage'
import { deleteAllItemsInWorkspace } from '@/store/workspace'
import { deleteTabsState } from '@/store/tabs'
import { runWorkspaceMigration } from '@/store/workspaceMigration'

interface WorkspaceContextValue {
  workspaceList: WorkspaceMeta[]
  activeWorkspaceId: string
  setActiveWorkspace: (id: string) => void
  createWorkspace: (name: string) => string
  renameWorkspace: (id: string, name: string) => void
  deleteWorkspace: (id: string) => Promise<void>
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaceList, setWorkspaceListState] = useState<WorkspaceMeta[]>([])
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string>('default')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    runWorkspaceMigration().then(() => {
      setWorkspaceListState(getWorkspaceList())
      setActiveWorkspaceIdState(getActiveWorkspaceId() ?? 'default')
      setReady(true)
    })
  }, [])

  const setActiveWorkspace = useCallback((id: string) => {
    setActiveWorkspaceIdState(id)
    persistActiveWorkspaceId(id)
  }, [])

  const createWorkspace = useCallback((name: string): string => {
    const id = crypto.randomUUID()
    const now = Date.now()
    const meta: WorkspaceMeta = { id, name: name || 'New workspace', createdAt: now, updatedAt: now }
    setWorkspaceListState((prev) => [...prev, meta])
    setWorkspaceList([...getWorkspaceList(), meta])
    setActiveWorkspaceIdState(id)
    persistActiveWorkspaceId(id)
    return id
  }, [])

  const renameWorkspace = useCallback((id: string, name: string) => {
    const updated = getWorkspaceList().map((w) =>
      w.id === id ? { ...w, name: name || w.name, updatedAt: Date.now() } : w
    )
    setWorkspaceListState(updated)
    setWorkspaceList(updated)
  }, [])

  const deleteWorkspace = useCallback(async (id: string) => {
    const list = getWorkspaceList()
    if (list.length <= 1) return
    await deleteAllItemsInWorkspace(id)
    await deleteTabsState(id)
    const next = list.filter((w) => w.id !== id)
    setWorkspaceList(next)
    setWorkspaceListState(next)
    if (getActiveWorkspaceId() === id) {
      const other = next[0]!
      setActiveWorkspaceIdState(other.id)
      persistActiveWorkspaceId(other.id)
    }
  }, [])

  const value: WorkspaceContextValue = {
    workspaceList,
    activeWorkspaceId: ready ? activeWorkspaceId : getActiveWorkspaceId() ?? 'default',
    setActiveWorkspace,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
  }

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useActiveWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useActiveWorkspace must be used within WorkspaceProvider')
  return ctx
}
