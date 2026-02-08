import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getTheme,
  setTheme as persistTheme,
  getCompact,
  setCompact as persistCompact,
  getSidebarCollapsed,
  setSidebarCollapsed as persistSidebarCollapsed,
  getReduceMotion,
  setReduceMotion as persistReduceMotion,
  type Theme,
} from '@/store/storage'

interface SettingsContextValue {
  theme: Theme
  setTheme: (t: Theme) => void
  compact: boolean
  setCompact: (v: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void
  reduceMotion: boolean
  setReduceMotion: (v: boolean) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

function getEffectiveReduceMotion(): boolean {
  if (typeof window === 'undefined') return false
  const user = getReduceMotion()
  const prefers = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return user || prefers
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getTheme())
  const [compact, setCompactState] = useState(() => getCompact())
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(() => getSidebarCollapsed())
  const [reduceMotion, setReduceMotionState] = useState(() => getReduceMotion())

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-cyberpunk', 'theme-octopus')
    document.documentElement.classList.add(`theme-${theme}`)
    if (theme === 'dark' || theme === 'cyberpunk' || theme === 'octopus') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  useEffect(() => {
    if (compact) document.documentElement.classList.add('compact')
    else document.documentElement.classList.remove('compact')
  }, [compact])

  useEffect(() => {
    const effective = getEffectiveReduceMotion()
    if (effective) document.documentElement.classList.add('reduce-motion')
    else document.documentElement.classList.remove('reduce-motion')
  }, [reduceMotion])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handler = () => {
      const effective = getEffectiveReduceMotion()
      if (effective) document.documentElement.classList.add('reduce-motion')
      else document.documentElement.classList.remove('reduce-motion')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [reduceMotion])

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

  const setReduceMotion = useCallback((v: boolean) => {
    setReduceMotionState(v)
    persistReduceMotion(v)
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
        reduceMotion,
        setReduceMotion,
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
