import { useSettings } from '@/contexts/SettingsContext'
import { THEMES, FONTS, getFontLabel, getFontFamilyPreview, type Theme, type AppFont } from '@/store/storage'

export function SettingsView() {
  const { theme, setTheme, font, setFont, compact, setCompact, reduceMotion, setReduceMotion } = useSettings()

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Settings</h2>

      <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-lg dark:border-slate-700/60 dark:bg-slate-800/80">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Theme</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Choose from Light, Dark, Cyberpunk, Octopus, Pip-Boy, or Lofi.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded-xl px-5 py-2.5 text-sm font-medium capitalize transition-all duration-200 ${
                theme === t
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'border border-slate-300/60 bg-white/60 text-slate-700 hover:bg-white hover:shadow-md hover:opacity-95 dark:border-slate-600/60 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-700/80'
              }`}
              onClick={() => setTheme(t as Theme)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-lg dark:border-slate-700/60 dark:bg-slate-800/80">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Font</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Choose a typeface for the app. Works with any theme.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {FONTS.map((f) => (
            <button
              key={f}
              type="button"
              className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                font === f
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'border border-slate-300/60 bg-white/60 text-slate-700 hover:bg-white hover:shadow-md hover:opacity-95 dark:border-slate-600/60 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-700/80'
              }`}
              onClick={() => setFont(f as AppFont)}
              style={font === f ? undefined : { fontFamily: getFontFamilyPreview(f as AppFont) }}
            >
              {getFontLabel(f as AppFont)}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-lg dark:border-slate-700/60 dark:bg-slate-800/80">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Compact mode</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Reduce padding and font size across the app.</p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={compact}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-all duration-200 ${
              compact ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            onClick={() => setCompact(!compact)}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                compact ? 'translate-x-5' : 'translate-x-0.5'
              }`}
              style={{ marginTop: 2 }}
            />
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{compact ? 'On' : 'Off'}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-lg dark:border-slate-700/60 dark:bg-slate-800/80">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Reduce motion</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Minimize animations and transitions. Also respects your system preference.</p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={reduceMotion}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 rounded-full transition-all duration-200 ${
              reduceMotion ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25' : 'bg-slate-300 dark:bg-slate-600'
            }`}
            onClick={() => setReduceMotion(!reduceMotion)}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform ${
                reduceMotion ? 'translate-x-5' : 'translate-x-0.5'
              }`}
              style={{ marginTop: 2 }}
            />
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{reduceMotion ? 'On' : 'Off'}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/60 bg-white/80 backdrop-blur-sm p-6 shadow-lg dark:border-slate-700/60 dark:bg-slate-800/80">
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Theme preview</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Verify contrast: card, button, input, and flashcard sample.</p>
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border border-slate-200/60 bg-slate-50/60 p-4 shadow-md dark:border-slate-600/60 dark:bg-slate-700/50">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Sample card</p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Secondary text</p>
          </div>
          <div className="flex gap-3">
            <button type="button" className="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:opacity-95">
              Primary
            </button>
            <button type="button" className="rounded-xl border border-slate-300/60 bg-white/60 px-4 py-2 text-sm font-medium text-slate-700 shadow-md hover:bg-white hover:shadow-lg transition-all duration-200 hover:opacity-95 dark:border-slate-600/60 dark:bg-slate-700/60 dark:text-slate-200 dark:hover:bg-slate-600/80">
              Secondary
            </button>
          </div>
          <input
            type="text"
            readOnly
            value="Sample input"
            className="w-full rounded-xl border border-slate-300/60 bg-white/60 px-4 py-2.5 text-sm text-slate-800 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all dark:border-slate-600/60 dark:bg-slate-800/60 dark:text-slate-200"
          />
          <div className="rounded-xl border-2 border-border-default bg-flashcard p-5 shadow-md">
            <p className="text-sm font-medium text-text-primary">Flashcard sample text</p>
            <p className="mt-2 text-xs text-text-muted">Muted text</p>
          </div>
        </div>
      </div>
    </div>
  )
}
