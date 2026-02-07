import { useState } from 'react'
import { Pomodoro } from './Pomodoro'
import { CustomTimer } from './CustomTimer'
import { Flashcards } from './Flashcards'

type StudyTab = 'pomodoro' | 'timer' | 'flashcards'

export function StudyView() {
  const [tab, setTab] = useState<StudyTab>('pomodoro')

  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === 'pomodoro' ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
          onClick={() => setTab('pomodoro')}
        >
          Pomodoro
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === 'timer' ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
          onClick={() => setTab('timer')}
        >
          Custom timer
        </button>
        <button
          type="button"
          className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === 'flashcards' ? 'bg-blue-100 dark:bg-blue-900/50' : ''}`}
          onClick={() => setTab('flashcards')}
        >
          Flashcards
        </button>
      </div>
      {tab === 'pomodoro' && <Pomodoro />}
      {tab === 'timer' && <CustomTimer />}
      {tab === 'flashcards' && <Flashcards />}
    </div>
  )
}
