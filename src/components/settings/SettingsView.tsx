import { useSettings } from '@/contexts/SettingsContext'
import { THEMES, type Theme } from '@/store/storage'

export function SettingsView() {
  const { theme, setTheme, compact, setCompact, sidebarCollapsed } = useSettings()

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Settings</h2>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">Theme</h3>
        <p className="mt-1 text-sm text-slate-500">Choose Light, Dark, or Sepia.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                theme === t
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
              onClick={() => setTheme(t as Theme)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">Compact mode</h3>
        <p className="mt-1 text-sm text-slate-500">Reduce padding and font size across the app.</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={compact}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
              compact ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            onClick={() => setCompact(!compact)}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                compact ? 'translate-x-5' : 'translate-x-0.5'
              }`}
              style={{ marginTop: 2 }}
            />
          </button>
          <span className="text-sm text-slate-700 dark:text-slate-300">{compact ? 'On' : 'Off'}</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">Sidebar</h3>
        <p className="mt-1 text-sm text-slate-500">Sidebar is {sidebarCollapsed ? 'collapsed' : 'expanded'}. Use the collapse/expand button on the sidebar to change it.</p>
      </div>
    </div>
  )
}
