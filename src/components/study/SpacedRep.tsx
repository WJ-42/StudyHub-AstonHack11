import { useState, useEffect, useCallback } from 'react'
import { getSpacedRepState, setSpacedRepState, generateId, type SpacedRepState, type SpacedRepSession } from '@/store/study'

export function SpacedRep() {
  const [state, setState] = useState<SpacedRepState | null>(null)
  const [newLabel, setNewLabel] = useState('')

  const load = useCallback(async () => {
    const s = await getSpacedRepState()
    setState(s)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const persist = useCallback((next: SpacedRepState) => {
    setSpacedRepState(next)
    setState(next)
  }, [])

  if (!state) return <p className="text-slate-500">Loading...</p>

  const addSession = () => {
    const label = newLabel.trim() || 'Session'
    const session: SpacedRepSession = {
      id: generateId(),
      label,
      scheduledDate: new Date().toISOString().slice(0, 10),
      completed: false,
    }
    persist({ ...state, sessions: [...state.sessions, session] })
    setNewLabel('')
  }

  const toggleComplete = (id: string) => {
    const sessions = state.sessions.map((s) =>
      s.id === id ? { ...s, completed: !s.completed, completedAt: s.completed ? undefined : Date.now() } : s
    )
    persist({ ...state, sessions })
  }

  const removeSession = (id: string) => {
    persist({ ...state, sessions: state.sessions.filter((s) => s.id !== id) })
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Spaced repetition planner</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Plan sessions and tick them off. Simple scheduler (no algorithm).</p>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="Session label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        />
        <button type="button" className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700" onClick={addSession}>
          Add session
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {state.sessions.map((s) => (
          <li
            key={s.id}
            className={`flex items-center gap-2 rounded border px-3 py-2 text-sm ${
              s.completed ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 'border-slate-200 dark:border-slate-600'
            }`}
          >
            <button
              type="button"
              className="flex-shrink-0 rounded border border-slate-300 p-0.5 dark:border-slate-600"
              onClick={() => toggleComplete(s.id)}
              aria-label={s.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {s.completed ? '✓' : '○'}
            </button>
            <span className={s.completed ? 'text-slate-500 line-through dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'}>
              {s.label}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{s.scheduledDate}</span>
            <button type="button" className="ml-auto text-red-600 hover:underline" onClick={() => removeSession(s.id)} aria-label="Remove session">
              ×
            </button>
          </li>
        ))}
      </ul>
      {state.sessions.length === 0 && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Add a session to get started.</p>
      )}
    </div>
  )
}
