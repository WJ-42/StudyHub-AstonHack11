import { Outlet, useParams, Navigate } from 'react-router-dom'
import { TopBar } from '@/components/TopBar'
import { Sidebar } from '@/components/Sidebar'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import { PersistentMediaPlayer } from '@/components/media/PersistentMediaPlayer'
import { type AppSection } from '@/types'
import { isLoggedIn } from '@/store/session'

const VALID_SECTIONS: AppSection[] = ['workspace', 'study', 'media', 'csv', 'settings']

export function AppLayout() {
  const { section } = useParams<{ section?: string }>()
  if (!isLoggedIn()) {
    return <Navigate to="/" replace />
  }

  const sectionParam = (section ?? 'workspace').toLowerCase()
  const activeSection = VALID_SECTIONS.includes(sectionParam as AppSection) ? sectionParam : 'workspace'

  return (
    <WorkspaceProvider>
      <LayoutProvider>
        <div className="flex h-screen flex-col bg-slate-100 dark:bg-slate-900">
          <TopBar />
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-auto p-4 pb-0 min-w-0" aria-label="Main content">
              <div className="pb-4">
                <Outlet context={{ section: activeSection }} />
              </div>
            </main>
          </div>
          <PersistentMediaPlayer />
        </div>
      </LayoutProvider>
    </WorkspaceProvider>
  )
}

export function AppLayoutRedirect() {
  return <Navigate to="/app/workspace" replace />
}
