import { useState, useEffect, useCallback } from 'react'
import { getStudyLastMode, setStudyLastMode, type StudyMode } from '@/store/storage'
import { Pomodoro } from './Pomodoro'
import { CustomTimer } from './CustomTimer'
import { Flashcards } from './Flashcards'
import { FiftyTwoSeventeen } from './FiftyTwoSeventeen'
import { Timeboxing } from './Timeboxing'
import { SpacedRep } from './SpacedRep'

const STUDY_TABS: { id: StudyMode; label: string }[] = [
  { id: 'pomodoro', label: 'Pomodoro' },
  { id: 'timer', label: 'Custom timer' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: '5217', label: '52/17' },
  { id: 'timeboxing', label: 'Timeboxing' },
  { id: 'spacedrep', label: 'Spaced rep' },
]

export function StudyView() {
  const [tab, setTabState] = useState<StudyMode>(() => getStudyLastMode() ?? 'pomodoro')

  useEffect(() => {
    const saved = getStudyLastMode()
    if (saved) setTabState(saved)
  }, [])

  const setTab = useCallback((t: StudyMode) => {
    setTabState(t)
    setStudyLastMode(t)
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {STUDY_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              tab === id ? 'bg-blue-100 dark:bg-blue-900/50' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'pomodoro' && <Pomodoro />}
      {tab === 'timer' && <CustomTimer />}
      {tab === 'flashcards' && <Flashcards />}
      {tab === '5217' && <FiftyTwoSeventeen />}
      {tab === 'timeboxing' && <Timeboxing />}
      {tab === 'spacedrep' && <SpacedRep />}
    </div>
  )
}
