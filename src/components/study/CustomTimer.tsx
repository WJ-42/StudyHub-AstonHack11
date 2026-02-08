import { useState, useEffect, useRef, useCallback } from 'react'
import { getCustomTimerState, setCustomTimerState, type CustomTimerState } from '@/store/study'
import { requestNotificationPermission, showNotification } from '@/utils/notifications'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CustomTimer() {
  const [state, setState] = useState<CustomTimerState | null>(null)
  const [durationInput, setDurationInput] = useState('25')
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const s = await getCustomTimerState()
    setState(s)
    setDurationInput(String(s.durationMinutes))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!state?.isRunning) return
    tickRef.current = setInterval(async () => {
      const s = await getCustomTimerState()
      if (!s.isRunning) return
      const next = s.remainingSeconds - 1
      if (next <= 0) {
        const nextState = { ...s, remainingSeconds: 0, isRunning: false }
        await setCustomTimerState(nextState)
        setState(nextState)
        showNotification('Custom Timer Complete', { body: 'Your timer has finished!' })
      } else {
        const nextState = { ...s, remainingSeconds: next }
        await setCustomTimerState(nextState)
        setState(nextState)
      }
    }, 1000)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [state?.isRunning])

  if (!state) return <p className="text-slate-500">Loading...</p>

  const setDuration = async () => {
    const min = Math.max(1, Math.min(120, parseInt(durationInput, 10) || 25))
    const next = { ...state, durationMinutes: min, remainingSeconds: min * 60, isRunning: false }
    await setCustomTimerState(next)
    setState(next)
    setDurationInput(String(min))
  }

  const start = async () => {
    await requestNotificationPermission()
    const next = { ...state, isRunning: true }
    await setCustomTimerState(next)
    setState(next)
  }
  const pause = async () => {
    const next = { ...state, isRunning: false }
    await setCustomTimerState(next)
    setState(next)
  }
  const reset = async () => {
    const next = { ...state, remainingSeconds: state.durationMinutes * 60, isRunning: false }
    await setCustomTimerState(next)
    setState(next)
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Custom timer</h3>
      <div className="mt-4 flex items-center gap-2">
        <label htmlFor="custom-duration" className="text-sm text-slate-600 dark:text-slate-400">Duration (minutes)</label>
        <input
          id="custom-duration"
          type="number"
          min={1}
          max={120}
          value={durationInput}
          onChange={(e) => setDurationInput(e.target.value)}
          onBlur={setDuration}
          className="w-20 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        />
        <button type="button" className="rounded bg-slate-200 px-2 py-1 text-sm dark:bg-slate-700" onClick={setDuration}>Set</button>
      </div>
      <p className="mt-4 text-4xl font-mono text-slate-800 dark:text-slate-100">{formatTime(state.remainingSeconds)}</p>
      <div className="mt-4 flex gap-2">
        {state.isRunning ? (
          <button type="button" className="rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600" onClick={pause}>Pause</button>
        ) : (
          <button type="button" className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700" onClick={start}>Start</button>
        )}
        <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600" onClick={reset}>Reset</button>
      </div>
    </div>
  )
}
