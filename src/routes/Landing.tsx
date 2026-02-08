import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isLoggedIn, setLoggedIn } from '@/store/session'
import { useSettings } from '@/contexts/SettingsContext'
import { THEMES, type Theme } from '@/store/storage'

const FEATURES = [
  {
    id: 'workspace',
    title: 'Workspace',
    description: 'Organise files and folders. Import documents and open them in tabs.',
    studentHelp:
      'Keep all your lecture notes, PDFs, and study materials in one place. No more hunting through downloads—everything stays organised and opens in quick-switch tabs.',
    icon: '📁',
  },
  {
    id: 'study',
    title: 'Study Modes',
    description: 'Pomodoro timer, custom countdown, and flashcards to study effectively.',
    studentHelp:
      'Beat procrastination with focused work blocks, time exams with custom timers, and ace your revision with built-in flashcards. All in one tab.',
    icon: '📚',
  },
  {
    id: 'media',
    title: 'Media Player Hub',
    description: 'Embed Spotify and YouTube. Keep your last link per provider.',
    studentHelp:
      'Study with your favourite lo-fi playlists or white noise. Paste a link once and it stays—no switching apps or losing your focus music.',
    icon: '🎵',
  },
  {
    id: 'csv',
    title: 'CSV Visualizer',
    description: 'Open CSV files, view as table, and build bar or line charts from your data.',
    studentHelp:
      'Turn data-heavy assignments into clear charts in seconds. Great for stats, research projects, or any coursework with spreadsheets.',
    icon: '📊',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Theme, compact mode, and sidebar preferences that persist across sessions.',
    studentHelp:
      'Tweak the layout and appearance to fit your workflow. Compact mode gives you more screen space; sidebar options keep your workspace clean.',
    icon: '⚙️',
  },
  {
    id: 'themes',
    title: 'Themes',
    description: 'Choose how Study Hub looks. Light, Dark, Cyberpunk, Octopus, Pip-Boy, or Lofi.',
    studentHelp:
      'Find a theme that matches your vibe. Dark for late-night cramming, Lofi for a cosy feel, or something bold when you need that extra motivation.',
    icon: '🎨',
  },
]

function useScrollVisibility(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold, rootMargin: '0px 0px -80px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

export function Landing() {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const { theme, setTheme } = useSettings()

  useEffect(() => {
    if (loggedIn) navigate('/app', { replace: true })
  }, [loggedIn, navigate])

  const handleGuest = () => {
    setLoggedIn(true)
    navigate('/app')
  }

  const handleLogin = () => {
    // Placeholder: no real auth yet
    setLoggedIn(true)
    navigate('/app')
  }

  const handleCreateAccount = () => {
    // Placeholder: no real auth yet
    setLoggedIn(true)
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        {/* Intro section - fades in on load */}
        <section className="animate-landing-intro text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-5xl">
            Study Hub
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Organise, study, and focus in one place. Files, timers, flashcards,
            and music — all in your browser.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleLogin}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:translate-y-0 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Login
            </button>
            <button
              type="button"
              onClick={handleCreateAccount}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-md active:translate-y-0 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={handleGuest}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              Use as Guest
            </button>
          </div>
        </section>

        {/* Features section - fades in/out on scroll */}
        <section className="mt-28">
          <ScrollHeading />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <ScrollFeatureCard
                key={f.id}
                feature={f}
                isThemes={f.id === 'themes'}
                theme={theme}
                setTheme={setTheme}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ScrollHeading() {
  const { ref, isVisible } = useScrollVisibility(0.1)
  return (
    <h2
      ref={ref}
      className={`text-center text-2xl font-semibold text-slate-800 transition-all duration-500 dark:text-slate-100 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}
    >
      Everything you need to study
    </h2>
  )
}

function ScrollFeatureCard({
  feature,
  isThemes,
  theme,
  setTheme,
}: {
  feature: (typeof FEATURES)[0]
  isThemes?: boolean
  theme?: Theme
  setTheme?: (t: Theme) => void
}) {
  const { ref, isVisible } = useScrollVisibility(0.15)
  const cardClass = `flex min-h-0 flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 dark:border-slate-700 dark:bg-slate-800 ${
    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
  } hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600`

  const footer = isThemes && theme && setTheme ? (
    <div className="mt-4 flex flex-wrap gap-2">
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 ${
            theme === t
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'border border-slate-300 bg-slate-50 text-slate-700 hover:border-slate-400 hover:bg-slate-100 hover:shadow-md dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
          }`}
          onClick={() => setTheme(t)}
        >
          {t}
        </button>
      ))}
    </div>
  ) : (
    <div className="mt-auto border-t border-slate-200/60 pt-4 dark:border-slate-600/60">
      <span className="text-xs text-slate-500 dark:text-slate-500">
        Get started to explore →
      </span>
    </div>
  )

  return (
    <div ref={ref} className={cardClass}>
      <span className="text-2xl" aria-hidden>
        {feature.icon}
      </span>
      <h3 className="mt-3 font-semibold text-slate-800 dark:text-slate-100">
        {feature.title}
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        {feature.description}
      </p>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-500">
        {feature.studentHelp}
      </p>
      {footer}
    </div>
  )
}
