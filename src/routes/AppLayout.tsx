import { Outlet, useParams, Navigate } from 'react-router-dom'
import { TopBar } from '@/components/TopBar'
import { Sidebar } from '@/components/Sidebar'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import { PersistentMediaPlayer } from '@/components/media/PersistentMediaPlayer'
import { type AppSection } from '@/types'
import { isLoggedIn } from '@/store/session'

const VALID_SECTIONS: AppSection[] = ['workspace', 'study', 'media', 'csv', 'settings']

function AppLayoutContent() {
  const { section } = useParams<{ section?: string }>()
  
  const sectionParam = (section ?? 'workspace').toLowerCase()
  const activeSection = VALID_SECTIONS.includes(sectionParam as AppSection) ? sectionParam : 'workspace'

  return (
    <LayoutProvider>
      <div className="relative flex h-screen flex-col bg-slate-50/95 dark:bg-slate-900/95">
        <TopBar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="relative z-10 flex-1 overflow-auto p-6 pb-0 min-w-0" aria-label="Main content">
            <div className="pb-6">
              <Outlet context={{ section: activeSection }} />
            </div>
          </main>
        </div>
        <PersistentMediaPlayer />
      </div>
    </LayoutProvider>
  )
}

export function AppLayout() {
  if (!isLoggedIn()) {
    return <Navigate to="/" replace />
  }

  return (
    <WorkspaceProvider>
      <AppLayoutContent />
    </WorkspaceProvider>
  )
}

export function AppLayoutRedirect() {
  return <Navigate to="/app/workspace" replace />
}
