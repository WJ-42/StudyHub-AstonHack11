import { idbGet, idbPut, idbDelete } from './storage'

const TABS_STORE = 'tabs'

function tabsDocId(workspaceId: string): string {
  return `tabs_${workspaceId}`
}

export interface TabsState {
  id: string
  openTabIds: string[]
  activeTabId: string | null
}

export async function getTabsState(workspaceId: string): Promise<TabsState> {
  const key = tabsDocId(workspaceId)
  const state = await idbGet<TabsState>(TABS_STORE, key)
  return state ?? { id: key, openTabIds: [], activeTabId: null }
}

export async function setTabsState(workspaceId: string, state: Omit<TabsState, 'id'>): Promise<void> {
  const id = tabsDocId(workspaceId)
  await idbPut(TABS_STORE, { ...state, id })
}

export async function deleteTabsState(workspaceId: string): Promise<void> {
  await idbDelete(TABS_STORE, tabsDocId(workspaceId))
}
