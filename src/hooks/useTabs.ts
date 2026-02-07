import { useState, useEffect, useCallback } from 'react'
import { getTabsState, setTabsState } from '@/store/tabs'

export function useTabs() {
  const [openTabIds, setOpenTabIds] = useState<string[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    getTabsState().then((s) => {
      setOpenTabIds(s.openTabIds)
      setActiveTabId(s.activeTabId)
      setHydrated(true)
    })
  }, [])

  useEffect(() => {
    if (!hydrated) return
    setTabsState({ id: 'tabs', openTabIds, activeTabId }).catch(() => {})
  }, [hydrated, openTabIds, activeTabId])

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

  const setActive = useCallback((id: string) => {
    setActiveTabId(id)
  }, [])

  return {
    openTabIds,
    activeTabId,
    openTab,
    closeTab,
    setActiveTab: setActive,
  }
}
