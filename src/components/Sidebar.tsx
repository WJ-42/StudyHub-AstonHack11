import { Link, useParams } from 'react-router-dom'
import { SECTIONS, type AppSection } from '@/types'
import { useSettings } from '@/contexts/SettingsContext'
import { useLayout } from '@/contexts/LayoutContext'

const SECTION_ICONS: Record<AppSection, string> = {
  workspace: '📁',
  study: '📚',
  media: '🎵',
  csv: '📊',
  settings: '⚙️',
}

export function Sidebar() {
  const { section } = useParams<{ section?: string }>()
  const current = (section ?? 'workspace') as AppSection
  const { sidebarCollapsed } = useSettings()
  const { mobileMenuOpen, setMobileMenuOpen } = useLayout()

  const closeMobile = () => setMobileMenuOpen(false)

  const navContent = (
    <nav className="flex flex-col gap-0.5 p-2" aria-label="Main navigation">
      {SECTIONS.map(({ id, label }) => (
        <Link
          key={id}
          to={`/app/${id}`}
          title={sidebarCollapsed ? label : undefined}
          className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            current === id
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
              : 'text-slate-700 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
          } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
          onClick={closeMobile}
        >
          <span aria-hidden>{SECTION_ICONS[id]}</span>
          {!sidebarCollapsed && <span>{label}</span>}
        </Link>
      ))}
    </nav>
  )

  return (
    <>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          aria-hidden
          onClick={closeMobile}
        />
      )}
      <aside
        className={`flex flex-col border-r border-slate-200 bg-slate-50 transition-[width] dark:border-slate-700 dark:bg-slate-800/50
          ${sidebarCollapsed ? 'w-14' : 'w-56'}
          md:relative
          fixed inset-y-0 left-0 z-50 mt-14 md:mt-0
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="flex items-center justify-end p-2 md:hidden">
          <button type="button" className="rounded p-2 hover:bg-slate-200 dark:hover:bg-slate-700" onClick={closeMobile} aria-label="Close menu">×</button>
        </div>
        {navContent}
      </aside>
    </>
  )
}
