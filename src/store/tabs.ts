import { idbGet, idbPut } from './storage'

const TABS_STORE = 'tabs'
const TABS_KEY = 'tabs'

export interface TabsState {
  id: string
  openTabIds: string[]
  activeTabId: string | null
}

export async function getTabsState(): Promise<TabsState> {
  const state = await idbGet<TabsState>(TABS_STORE, TABS_KEY)
  return state ?? { id: TABS_KEY, openTabIds: [], activeTabId: null }
}

export async function setTabsState(state: TabsState): Promise<void> {
  await idbPut(TABS_STORE, { ...state, id: TABS_KEY })
}
