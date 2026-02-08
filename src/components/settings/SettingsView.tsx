import { useSettings } from '@/contexts/SettingsContext'
import { THEMES, type Theme } from '@/store/storage'

export function SettingsView() {
  const { theme, setTheme, compact, setCompact, sidebarCollapsed, reduceMotion, setReduceMotion } = useSettings()

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Settings</h2>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">Theme</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Choose Light, Dark, Cyberpunk, or Octopus.</p>
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
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Reduce padding and font size across the app.</p>
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
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">Reduce motion</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Minimize animations and transitions. Also respects your system preference.</p>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={reduceMotion}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
              reduceMotion ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            onClick={() => setReduceMotion(!reduceMotion)}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                reduceMotion ? 'translate-x-5' : 'translate-x-0.5'
              }`}
              style={{ marginTop: 2 }}
            />
          </button>
          <span className="text-sm text-slate-700 dark:text-slate-300">{reduceMotion ? 'On' : 'Off'}</span>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">Sidebar</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sidebar is {sidebarCollapsed ? 'collapsed' : 'expanded'}. Use the collapse/expand button on the sidebar to change it.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-medium text-slate-800 dark:text-slate-100">Theme preview</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Verify contrast: card, button, input, and flashcard sample.</p>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-700/50">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Sample card</p>
            <p className="text-xs text-slate-600 dark:text-slate-300">Secondary text</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">
              Primary
            </button>
            <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600">
              Secondary
            </button>
          </div>
          <input
            type="text"
            readOnly
            value="Sample input"
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          />
          <div className="rounded-lg border-2 border-border-default bg-flashcard p-4">
            <p className="text-sm text-text-primary">Flashcard sample text</p>
            <p className="mt-1 text-xs text-text-muted">Muted text</p>
          </div>
        </div>
      </div>
    </div>
  )
}
