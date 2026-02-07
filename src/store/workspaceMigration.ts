import { idbGet, idbPut, idbDelete } from './storage'
import {
  getWorkspaceList,
  setWorkspaceList,
  setActiveWorkspaceId,
  type WorkspaceMeta,
} from './storage'
import { getAllWorkspaceItemsUnscoped } from './workspace'
import { setTabsState } from './tabs'
import type { WorkspaceItem } from '@/types/workspace'

const WORKSPACE_STORE = 'workspace'
const TABS_STORE = 'tabs'
const DEFAULT_WORKSPACE_ID = 'default'

/** One-time migration: create default workspace, add workspaceId to existing items, copy tabs to tabs_default. */
export async function runWorkspaceMigration(): Promise<void> {
  const list = getWorkspaceList()
  if (list.length > 0) return

  const now = Date.now()
  const defaultMeta: WorkspaceMeta = {
    id: DEFAULT_WORKSPACE_ID,
    name: 'Default',
    createdAt: now,
    updatedAt: now,
  }
  setWorkspaceList([defaultMeta])
  setActiveWorkspaceId(DEFAULT_WORKSPACE_ID)

  const all = await getAllWorkspaceItemsUnscoped()
  for (const item of all) {
    const withWs = item as WorkspaceItem & { workspaceId?: string }
    if (withWs.workspaceId == null || withWs.workspaceId === undefined) {
      await idbPut(WORKSPACE_STORE, { ...item, workspaceId: DEFAULT_WORKSPACE_ID })
    }
  }

  const oldTabs = await idbGet<{ openTabIds: string[]; activeTabId: string | null }>(TABS_STORE, 'tabs')
  if (oldTabs && Array.isArray(oldTabs.openTabIds)) {
    await setTabsState(DEFAULT_WORKSPACE_ID, {
      openTabIds: oldTabs.openTabIds,
      activeTabId: oldTabs.activeTabId ?? null,
    })
    await idbDelete(TABS_STORE, 'tabs')
  }
}
