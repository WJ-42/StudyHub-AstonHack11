import { createContext, useContext, useState } from 'react'

interface LayoutContextValue {
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

const LayoutContext = createContext<LayoutContextValue | null>(null)

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  return (
    <LayoutContext.Provider value={{ mobileMenuOpen, setMobileMenuOpen }}>
      {children}
    </LayoutContext.Provider>
  )
}

export function useLayout() {
  const ctx = useContext(LayoutContext)
  return ctx ?? { mobileMenuOpen: false, setMobileMenuOpen: () => {} }
}
