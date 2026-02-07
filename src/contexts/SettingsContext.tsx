import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getTheme,
  setTheme as persistTheme,
  getCompact,
  setCompact as persistCompact,
  getSidebarCollapsed,
  setSidebarCollapsed as persistSidebarCollapsed,
  type Theme,
} from '@/store/storage'

interface SettingsContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  compact: boolean
  setCompact: (v: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getTheme())
  const [compact, setCompactState] = useState(() => getCompact())
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => getSidebarCollapsed())

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-sepia')
    document.documentElement.classList.add(`theme-${theme}`)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    if (compact) document.documentElement.classList.add('compact')
    else document.documentElement.classList.remove('compact')
  }, [compact])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    persistTheme(t)
  }, [])

  const setCompact = useCallback((v: boolean) => {
    setCompactState(v)
    persistCompact(v)
  }, [])

  const setSidebarCollapsed = useCallback((v: boolean) => {
    setSidebarCollapsedState(v)
    persistSidebarCollapsed(v)
  }, [])

  return (
    <SettingsContext.Provider
      value={{
        theme,
        setTheme,
        compact,
        setCompact,
        sidebarCollapsed,
        setSidebarCollapsed,
      }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
