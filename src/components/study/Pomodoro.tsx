import { useState, useEffect, useCallback } from 'react'
import { getPomodoroState, setPomodoroState, type PomodoroState } from '@/store/study'
import { requestNotificationPermission } from '@/utils/notifications'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Pomodoro() {
  const [state, setState] = useState<PomodoroState | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [workMinutes, setWorkMinutes] = useState(25)
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5)
  const [longBreakMinutes, setLongBreakMinutes] = useState(15)
  const [cyclesBeforeLongBreak, setCyclesBeforeLongBreak] = useState(4)

  const load = useCallback(async () => {
    const s = await getPomodoroState()
    setState(s)
    setWorkMinutes(s.workMinutes)
    setShortBreakMinutes(s.shortBreakMinutes)
    setLongBreakMinutes(s.longBreakMinutes)
    setCyclesBeforeLongBreak(s.cyclesBeforeLongBreak)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Sync from IDB every second when running (BackgroundTimerService does the actual ticking)
  useEffect(() => {
    if (!state?.isRunning) return
    const id = setInterval(load, 1000)
    return () => clearInterval(id)
  }, [state?.isRunning, load])

  if (!state) return <p className="text-slate-500">Loading...</p>

  const start = async () => {
    await requestNotificationPermission()
    const next = { ...state, isRunning: true }
    await setPomodoroState(next)
    setState(next)
  }
  const pause = async () => {
    const next = { ...state, isRunning: false }
    await setPomodoroState(next)
    setState(next)
  }
  const reset = async () => {
    const phase = state.phase
    const remaining = phase === 'work' ? state.workMinutes * 60 : phase === 'shortBreak' ? state.shortBreakMinutes * 60 : state.longBreakMinutes * 60
    const next = { ...state, remainingSeconds: remaining, isRunning: false }
    await setPomodoroState(next)
    setState(next)
  }
  const resetCycle = async () => {
    const next = { ...state, cycleCount: 0, phase: 'work' as const, remainingSeconds: state.workMinutes * 60, isRunning: false }
    await setPomodoroState(next)
    setState(next)
  }

  const saveSettings = async () => {
    if (!state) return
    const next: PomodoroState = {
      ...state,
      workMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      cyclesBeforeLongBreak,
      remainingSeconds: state.phase === 'work' ? workMinutes * 60 : state.phase === 'shortBreak' ? shortBreakMinutes * 60 : longBreakMinutes * 60,
      isRunning: false,
    }
    await setPomodoroState(next)
    setState(next)
    setShowSettings(false)
  }

  const phaseLabel = state.phase === 'work' ? 'Work' : state.phase === 'shortBreak' ? 'Short break' : 'Long break'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Pomodoro</h3>
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
          onClick={() => setShowSettings(!showSettings)}
        >
          {showSettings ? 'Hide' : 'Settings'}
        </button>
      </div>
      
      {showSettings && (
        <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-4 dark:bg-slate-700/50">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Work duration (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={workMinutes}
              onChange={(e) => setWorkMinutes(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Short break (minutes)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={shortBreakMinutes}
              onChange={(e) => setShortBreakMinutes(Math.max(1, Math.min(30, parseInt(e.target.value) || 1)))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Long break (minutes)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={longBreakMinutes}
              onChange={(e) => setLongBreakMinutes(Math.max(1, Math.min(60, parseInt(e.target.value) || 1)))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cycles before long break</label>
            <input
              type="number"
              min="1"
              max="10"
              value={cyclesBeforeLongBreak}
              onChange={(e) => setCyclesBeforeLongBreak(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
            />
          </div>
          <button
            type="button"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            onClick={saveSettings}
          >
            Apply Settings
          </button>
        </div>
      )}
      
      <p className="mt-4 text-sm text-slate-500">Cycle: {state.cycleCount} · Phase: {phaseLabel}</p>
      <p className="mt-4 text-4xl font-mono text-slate-800 dark:text-slate-100">{formatTime(state.remainingSeconds)}</p>
      <div className="mt-4 flex gap-2">
        {state.isRunning ? (
          <button type="button" className="rounded-lg bg-amber-500 px-4 py-2 text-white hover:bg-amber-600" onClick={pause}>Pause</button>
        ) : (
          <button type="button" className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700" onClick={start}>Start</button>
        )}
        <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600" onClick={reset}>Reset</button>
        <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600" onClick={resetCycle}>Reset cycle</button>
      </div>
    </div>
  )
}
