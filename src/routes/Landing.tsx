import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { isLoggedIn, setLoggedIn } from '@/store/session'

const FEATURES = [
  {
    id: 'workspace',
    title: 'Workspace',
    description: 'Organise files and folders. Import documents and open them in tabs.',
    icon: '📁',
  },
  {
    id: 'study',
    title: 'Study Modes',
    description: 'Pomodoro timer, custom countdown, and flashcards to study effectively.',
    icon: '📚',
  },
  {
    id: 'media',
    title: 'Media Player Hub',
    description: 'Embed Spotify and YouTube. Keep your last link per provider.',
    icon: '🎵',
  },
  {
    id: 'csv',
    title: 'CSV Visualizer',
    description: 'Open CSV files, view as table, and build bar or line charts from your data.',
    icon: '📊',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Theme, compact mode, and sidebar preferences that persist across sessions.',
    icon: '⚙️',
  },
]

export function Landing() {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()

  useEffect(() => {
    if (loggedIn) navigate('/app', { replace: true })
  }, [loggedIn, navigate])

  const handleGetStarted = () => {
    setLoggedIn(true)
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <section className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-5xl">
            Study Hub
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Organise, study, and focus in one place. Files, timers, flashcards, and music — all in your browser.
          </p>
          <div className="mt-8">
            <button
              type="button"
              onClick={handleGetStarted}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              Get Started
            </button>
            <button
              type="button"
              onClick={handleGetStarted}
              className="ml-4 rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Login
            </button>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-center text-2xl font-semibold text-slate-800 dark:text-slate-100">
            Everything you need to study
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <span className="text-2xl" aria-hidden>{f.icon}</span>
                <h3 className="mt-3 font-semibold text-slate-800 dark:text-slate-100">{f.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
