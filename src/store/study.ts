import { idbGetAll, idbGet, idbPut, idbDelete } from './storage'

const STORE = 'study'

export interface PomodoroState {
  id: 'pomodoro'
  phase: 'work' | 'shortBreak' | 'longBreak'
  remainingSeconds: number
  cycleCount: number
  isRunning: boolean
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  cyclesBeforeLongBreak: number
}

export interface CustomTimerState {
  id: 'customTimer'
  durationMinutes: number
  remainingSeconds: number
  isRunning: boolean
}

export interface Flashcard {
  id: string
  deckId: string
  front: string
  back: string
}

export interface FlashcardDeck {
  id: string
  name: string
  createdAt: number
}

const POMODORO_DEFAULTS: PomodoroState = {
  id: 'pomodoro',
  phase: 'work',
  remainingSeconds: 25 * 60,
  cycleCount: 0,
  isRunning: false,
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
}

const CUSTOM_TIMER_DEFAULTS: CustomTimerState = {
  id: 'customTimer',
  durationMinutes: 25,
  remainingSeconds: 25 * 60,
  isRunning: false,
}

export async function getPomodoroState(): Promise<PomodoroState> {
  const s = await idbGet<PomodoroState>(STORE, 'pomodoro')
  return s ?? POMODORO_DEFAULTS
}

export async function setPomodoroState(state: PomodoroState): Promise<void> {
  await idbPut(STORE, state)
}

export async function getCustomTimerState(): Promise<CustomTimerState> {
  const s = await idbGet<CustomTimerState>(STORE, 'customTimer')
  return s ?? CUSTOM_TIMER_DEFAULTS
}

export async function setCustomTimerState(state: CustomTimerState): Promise<void> {
  await idbPut(STORE, state)
}

export async function getDecks(): Promise<FlashcardDeck[]> {
  const all = await idbGetAll<FlashcardDeck | Flashcard>(STORE)
  return all.filter((x): x is FlashcardDeck => 'name' in x && 'createdAt' in x && !('deckId' in x))
}

export async function getCards(deckId: string): Promise<Flashcard[]> {
  const all = await idbGetAll<Flashcard>(STORE)
  return all.filter((x) => x.deckId === deckId)
}

export async function saveDeck(deck: FlashcardDeck): Promise<void> {
  await idbPut(STORE, deck)
}

export async function deleteDeck(deckId: string): Promise<void> {
  const cards = await getCards(deckId)
  for (const c of cards) await idbDelete(STORE, c.id)
  await idbDelete(STORE, deckId)
}

export async function saveCard(card: Flashcard): Promise<void> {
  await idbPut(STORE, card)
}

export async function deleteCard(cardId: string): Promise<void> {
  await idbDelete(STORE, cardId)
}

export function generateId(): string {
  return crypto.randomUUID()
}
