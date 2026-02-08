import { useState, useEffect, useRef, useCallback } from 'react'
import { get5217State, set5217State, type FiftyTwoSeventeenState } from '@/store/study'
import { requestNotificationPermission, showNotification } from '@/utils/notifications'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function FiftyTwoSeventeen() {
  const [state, setState] = useState<FiftyTwoSeventeenState | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const s = await get5217State()
    setState(s)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!state?.isRunning) return
    tickRef.current = setInterval(async () => {
      const s = await get5217State()
      if (!s.isRunning) return
      const next = s.remainingSeconds - 1
      if (next <= 0) {
        const newPhase: FiftyTwoSeventeenState['phase'] = s.phase === 'work' ? 'break' : 'work'
        const newRemaining = newPhase === 'work' ? s.workMinutes * 60 : s.breakMinutes * 60
        const nextState: FiftyTwoSeventeenState = { ...s, phase: newPhase, remainingSeconds: newRemaining }
        await set5217State(nextState)
        setState(nextState)
        if (newPhase === 'break') {
          showNotification('52/17: Work Complete', { body: 'Great work! Time for a 17-minute break.' })
        } else {
          showNotification('52/17: Break Complete', { body: 'Break time over. Ready for 52 minutes of focus?' })
        }
      } else {
        const nextState = { ...s, remainingSeconds: next }
        await set5217State(nextState)
        setState(nextState)
      }
    }, 1000)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [state?.isRunning])

  if (!state) return <p className="text-slate-500">Loading...</p>

  const start = async () => {
    await requestNotificationPermission()
    const next = { ...state, isRunning: true }
    await set5217State(next)
    setState(next)
  }
  const pause = async () => {
    const next = { ...state, isRunning: false }
    await set5217State(next)
    setState(next)
  }
  const reset = async () => {
    const remaining = state.phase === 'work' ? state.workMinutes * 60 : state.breakMinutes * 60
    const next = { ...state, remainingSeconds: remaining, isRunning: false }
    await set5217State(next)
    setState(next)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">52/17 method</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">52 minutes work, 17 minutes break.</p>
      <p className="mt-4 text-3xl font-mono font-medium text-slate-800 dark:text-slate-100">
        {formatTime(state.remainingSeconds)}
      </p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {state.phase === 'work' ? 'Work' : 'Break'}
      </p>
      <div className="mt-4 flex gap-2">
        {!state.isRunning ? (
          <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onClick={start}>
            Start
          </button>
        ) : (
          <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600" onClick={pause}>
            Pause
          </button>
        )}
        <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  )
}
