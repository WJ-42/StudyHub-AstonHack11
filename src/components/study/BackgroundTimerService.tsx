import { useEffect, useRef } from 'react'
import {
  getCustomTimerState,
  setCustomTimerState,
  getPomodoroState,
  setPomodoroState,
  get5217State,
  set5217State,
  getTimeboxState,
  setTimeboxState,
  type PomodoroState,
  type FiftyTwoSeventeenState,
} from '@/store/study'
import { showNotification } from '@/utils/notifications'
import { useToast } from '@/contexts/ToastContext'

/** Runs timer ticks in the background regardless of which page is visible. */
export function BackgroundTimerService() {
  const { showToast } = useToast()

  const showToastRef = useRef(showToast)
  showToastRef.current = showToast

  useEffect(() => {
    const tick = async () => {
      const toast = (msg: string) => {
        showToastRef.current(msg, 'success', 5000)
      }

      // Custom Timer
      const custom = await getCustomTimerState()
      if (custom.isRunning) {
        const next = custom.remainingSeconds - 1
        if (next <= 0) {
          await setCustomTimerState({ ...custom, remainingSeconds: 0, isRunning: false })
          showNotification('Custom Timer Complete', { body: 'Your timer has finished!' })
          toast('Custom timer complete!')
        } else {
          await setCustomTimerState({ ...custom, remainingSeconds: next })
        }
      }

      // Pomodoro
      const pomo = await getPomodoroState()
      if (pomo.isRunning) {
        const next = pomo.remainingSeconds - 1
        if (next <= 0) {
          let newPhase: PomodoroState['phase']
          let newRemaining: number
          let newCycle = pomo.cycleCount
          if (pomo.phase === 'work') {
            newCycle += 1
            const needLong = pomo.cyclesBeforeLongBreak > 0 && newCycle % pomo.cyclesBeforeLongBreak === 0
            newPhase = needLong ? 'longBreak' : 'shortBreak'
            newRemaining = needLong ? pomo.longBreakMinutes * 60 : pomo.shortBreakMinutes * 60
            showNotification('Pomodoro: Work Complete', {
              body: `Great work! Time for a ${needLong ? 'long' : 'short'} break.`,
            })
            toast(needLong ? 'Work complete — long break!' : 'Work complete — short break!')
          } else {
            newPhase = 'work'
            newRemaining = pomo.workMinutes * 60
            showNotification('Pomodoro: Break Complete', { body: 'Break time is over. Ready to focus?' })
            toast('Break complete — ready to focus!')
          }
          await setPomodoroState({
            ...pomo,
            phase: newPhase,
            remainingSeconds: newRemaining,
            cycleCount: newCycle,
          })
        } else {
          await setPomodoroState({ ...pomo, remainingSeconds: next })
        }
      }

      // 52/17
      const s5217 = await get5217State()
      if (s5217.isRunning) {
        const next = s5217.remainingSeconds - 1
        if (next <= 0) {
          const newPhase: FiftyTwoSeventeenState['phase'] = s5217.phase === 'work' ? 'break' : 'work'
          const newRemaining = newPhase === 'work' ? s5217.workMinutes * 60 : s5217.breakMinutes * 60
          await set5217State({ ...s5217, phase: newPhase, remainingSeconds: newRemaining })
          if (newPhase === 'break') {
            showNotification('52/17: Work Complete', { body: 'Great work! Time for a 17-minute break.' })
            toast('52/17: Work complete — break time!')
          } else {
            showNotification('52/17: Break Complete', { body: 'Break time over. Ready for 52 minutes of focus?' })
            toast('52/17: Break complete — time to focus!')
          }
        } else {
          await set5217State({ ...s5217, remainingSeconds: next })
        }
      }

      // Timeboxing
      const tb = await getTimeboxState()
      if (tb.isRunning && tb.blocks.length) {
        const next = tb.remainingSeconds - 1
        if (next <= 0) {
          const nextIndex = tb.currentIndex + 1
          if (nextIndex >= tb.blocks.length) {
            await setTimeboxState({ ...tb, isRunning: false, remainingSeconds: 0 })
            showNotification('Timeboxing Complete', { body: 'All blocks finished!' })
            toast('Timeboxing complete!')
          } else {
            const nextBlock = tb.blocks[nextIndex]
            await setTimeboxState({
              ...tb,
              currentIndex: nextIndex,
              remainingSeconds: (nextBlock?.durationMinutes ?? 25) * 60,
            })
          }
        } else {
          await setTimeboxState({ ...tb, remainingSeconds: next })
        }
      }
    }

    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return null
}
