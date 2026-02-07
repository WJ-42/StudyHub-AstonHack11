import { useState, useRef, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { SECTIONS, type AppSection } from '@/types'
import { useSettings } from '@/contexts/SettingsContext'
import { useLayout } from '@/contexts/LayoutContext'
import { useActiveWorkspace } from '@/contexts/WorkspaceContext'
import { InputModal } from '@/components/ui/InputModal'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

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
  const { sidebarCollapsed, setSidebarCollapsed } = useSettings()
  const { mobileMenuOpen, setMobileMenuOpen } = useLayout()
  const {
    workspaceList,
    activeWorkspaceId,
    setActiveWorkspace,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
  } = useActiveWorkspace()
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const closeMobile = () => setMobileMenuOpen(false)
  const activeMeta = workspaceList.find((w) => w.id === activeWorkspaceId)
  const activeName = activeMeta?.name ?? 'Workspace'
  const canDelete = workspaceList.length > 1

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setWorkspaceMenuOpen(false)
      }
    }
    if (workspaceMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [workspaceMenuOpen])

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
        <div className="flex items-center justify-between p-2">
          <button
            type="button"
            className="rounded p-2 hover:bg-slate-200 dark:hover:bg-slate-700"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
          <button type="button" className="rounded p-2 hover:bg-slate-200 dark:hover:bg-slate-700 md:hidden" onClick={closeMobile} aria-label="Close menu">×</button>
        </div>
        {!sidebarCollapsed && (
          <div className="relative px-2 pb-2" ref={menuRef}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              onClick={() => setWorkspaceMenuOpen((o) => !o)}
              aria-haspopup="true"
              aria-expanded={workspaceMenuOpen}
            >
              <span className="truncate">{activeName}</span>
              <span className="text-slate-400">▾</span>
            </button>
            {workspaceMenuOpen && (
              <div className="absolute left-2 right-2 top-full z-10 mt-1 max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => { setWorkspaceMenuOpen(false); setCreateModalOpen(true) }}
                >
                  Create workspace
                </button>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                  onClick={() => { setWorkspaceMenuOpen(false); setRenameId(activeWorkspaceId); setRenameModalOpen(true) }}
                >
                  Rename workspace
                </button>
                {canDelete && (
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-slate-100 dark:text-red-400 dark:hover:bg-slate-700"
                    onClick={() => { setWorkspaceMenuOpen(false); setDeleteId(activeWorkspaceId); setDeleteModalOpen(true) }}
                  >
                    Delete workspace
                  </button>
                )}
                <div className="my-1 border-t border-slate-200 dark:border-slate-600" />
                {workspaceList.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className={`block w-full truncate px-3 py-2 text-left text-sm ${w.id === activeWorkspaceId ? 'bg-blue-50 font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                    onClick={() => { setActiveWorkspace(w.id); setWorkspaceMenuOpen(false) }}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {navContent}
        <InputModal
          open={createModalOpen}
          title="Create workspace"
          label="Workspace name"
          defaultValue=""
          submitLabel="Create"
          onSubmit={(name) => { createWorkspace(name); setCreateModalOpen(false) }}
          onCancel={() => setCreateModalOpen(false)}
        />
        <InputModal
          open={renameModalOpen}
          title="Rename workspace"
          label="Workspace name"
          defaultValue={renameId ? workspaceList.find((w) => w.id === renameId)?.name ?? '' : ''}
          submitLabel="Save"
          onSubmit={(name) => { if (renameId) renameWorkspace(renameId, name); setRenameModalOpen(false); setRenameId(null) }}
          onCancel={() => { setRenameModalOpen(false); setRenameId(null) }}
        />
        <ConfirmModal
          open={deleteModalOpen}
          title="Delete workspace"
          message="Delete this workspace and all its files? This cannot be undone."
          confirmLabel="Delete"
          variant="danger"
          onConfirm={async () => { if (deleteId) await deleteWorkspace(deleteId); setDeleteModalOpen(false); setDeleteId(null) }}
          onCancel={() => { setDeleteModalOpen(false); setDeleteId(null) }}
        />
      </aside>
    </>
  )
}
