import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { logout, getUserName } from '@/store/session'
import { useSearch } from '@/contexts/SearchContext'
import { useLayout } from '@/contexts/LayoutContext'

export function TopBar() {
  const navigate = useNavigate()
  const name = getUserName()
  const { query, setQuery } = useSearch()
  const { setMobileMenuOpen } = useLayout()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [userMenuOpen])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="md:hidden rounded p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <span className="text-xl">☰</span>
        </button>
        <Link to="/app/workspace" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Study Hub
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <input
          type="search"
          placeholder="Search workspace..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          aria-label="Search workspace"
        />
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-haspopup="true"
            aria-expanded={userMenuOpen}
            aria-label="User menu"
            onClick={(e) => { e.stopPropagation(); setUserMenuOpen((o) => !o) }}
          >
            <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              U
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-300 hidden sm:inline">{name || 'User'}</span>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 min-w-[120px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
