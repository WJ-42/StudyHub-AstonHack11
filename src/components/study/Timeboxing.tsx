import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getTimeboxState,
  setTimeboxState,
  generateId,
  type TimeboxState,
  type TimeboxBlock,
} from '@/store/study'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function Timeboxing() {
  const [state, setState] = useState<TimeboxState | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [newMinutes, setNewMinutes] = useState('25')
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const load = useCallback(async () => {
    const s = await getTimeboxState()
    setState(s)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const persist = useCallback((next: TimeboxState) => {
    setTimeboxState(next)
    setState(next)
  }, [])

  useEffect(() => {
    if (!state?.isRunning || !state.blocks.length) return
    const current = state.blocks[state.currentIndex]
    if (!current) return
    tickRef.current = setInterval(async () => {
      const s = await getTimeboxState()
      if (!s.isRunning) return
      const next = s.remainingSeconds - 1
      if (next <= 0) {
        const nextIndex = s.currentIndex + 1
        if (nextIndex >= s.blocks.length) {
          persist({ ...s, isRunning: false, remainingSeconds: 0 })
          return
        }
        const nextBlock = s.blocks[nextIndex]
        persist({
          ...s,
          currentIndex: nextIndex,
          remainingSeconds: nextBlock.durationMinutes * 60,
        })
      } else {
        persist({ ...s, remainingSeconds: next })
      }
    }, 1000)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [state?.isRunning, state?.blocks.length, state?.currentIndex, persist])

  if (!state) return <p className="text-slate-500">Loading...</p>

  const addBlock = () => {
    const label = newLabel.trim() || 'Block'
    const minutes = Math.max(1, Math.min(120, parseInt(newMinutes, 10) || 25))
    const block: TimeboxBlock = {
      id: generateId(),
      label,
      durationMinutes: minutes,
      order: state.blocks.length,
    }
    const next: TimeboxState = {
      ...state,
      blocks: [...state.blocks, block],
    }
    if (state.blocks.length === 0) {
      next.currentIndex = 0
      next.remainingSeconds = minutes * 60
    }
    persist(next)
    setNewLabel('')
    setNewMinutes('25')
  }

  const removeBlock = (id: string) => {
    const blocks = state.blocks.filter((b) => b.id !== id)
    const currentIndex = Math.min(state.currentIndex, Math.max(0, blocks.length - 1))
    const current = blocks[currentIndex]
    persist({
      ...state,
      blocks,
      currentIndex,
      remainingSeconds: current ? current.durationMinutes * 60 : 0,
      isRunning: false,
    })
  }

  const start = () => {
    if (!state.blocks.length) return
    const current = state.blocks[state.currentIndex]
    if (!current) return
    persist({ ...state, remainingSeconds: current.durationMinutes * 60, isRunning: true })
  }

  const pause = () => {
    persist({ ...state, isRunning: false })
  }

  const currentBlock = state.blocks[state.currentIndex]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Timeboxing</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Set blocks with labels and run them one by one.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Block label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          className="rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        />
        <input
          type="number"
          min={1}
          max={120}
          placeholder="Minutes"
          value={newMinutes}
          onChange={(e) => setNewMinutes(e.target.value)}
          className="w-20 rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        />
        <button type="button" className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700" onClick={addBlock}>
          Add block
        </button>
      </div>
      <ul className="mt-4 space-y-2">
        {state.blocks.map((b, i) => (
          <li
            key={b.id}
            className={`flex items-center justify-between rounded border px-3 py-2 text-sm ${
              i === state.currentIndex ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-200 dark:border-slate-600'
            }`}
          >
            <span className="text-slate-800 dark:text-slate-200">{b.label}</span>
            <span className="text-slate-500 dark:text-slate-400">{b.durationMinutes} min</span>
            <button type="button" className="text-red-600 hover:underline" onClick={() => removeBlock(b.id)} aria-label="Remove block">
              ×
            </button>
          </li>
        ))}
      </ul>
      {currentBlock && (
        <>
          <p className="mt-4 text-2xl font-mono text-slate-800 dark:text-slate-100">{formatTime(state.remainingSeconds)}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{currentBlock.label}</p>
          <div className="mt-2 flex gap-2">
            {!state.isRunning ? (
              <button type="button" className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700" onClick={start}>
                Start
              </button>
            ) : (
              <button type="button" className="rounded border border-slate-300 px-4 py-2 text-sm dark:border-slate-600" onClick={pause}>
                Pause
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
