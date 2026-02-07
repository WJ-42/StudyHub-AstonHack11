import { useState, useEffect, useCallback } from 'react'
import { getTabsState, setTabsState } from '@/store/tabs'
import { useActiveWorkspace } from '@/contexts/WorkspaceContext'

export function useTabs() {
  const { activeWorkspaceId } = useActiveWorkspace()
  const [openTabIds, setOpenTabIds] = useState<string[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(false)
    getTabsState(activeWorkspaceId).then((s) => {
      setOpenTabIds(s.openTabIds)
      setActiveTabId(s.activeTabId)
      setHydrated(true)
    })
  }, [activeWorkspaceId])

  useEffect(() => {
    if (!hydrated) return
    setTabsState(activeWorkspaceId, { openTabIds, activeTabId }).catch(() => {})
  }, [hydrated, activeWorkspaceId, openTabIds, activeTabId])

  const openTab = useCallback((id: string) => {
    setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setActiveTabId(id)
  }, [])

  const closeTab = useCallback((id: string) => {
    setOpenTabIds((prev) => {
      const next = prev.filter((t) => t !== id)
      setActiveTabId((active) => {
        if (active !== id) return active
        const idx = prev.indexOf(id)
        return next[idx] ?? next[next.length - 1] ?? null
      })
      return next
    })
  }, [])

  const closeTabs = useCallback((ids: string[]) => {
    const idSet = new Set(ids)
    setOpenTabIds((prev) => {
      const next = prev.filter((t) => !idSet.has(t))
      setActiveTabId((active) => {
        if (!active || !idSet.has(active)) return active
        return next[0] ?? null
      })
      return next
    })
  }, [])

  const setActive = useCallback((id: string) => {
    setActiveTabId(id)
  }, [])

  return {
    openTabIds,
    activeTabId,
    openTab,
    closeTab,
    closeTabs,
    setActiveTab: setActive,
  }
}
