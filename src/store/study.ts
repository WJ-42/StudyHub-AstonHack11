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

export interface FiftyTwoSeventeenState {
  id: '5217'
  phase: 'work' | 'break'
  remainingSeconds: number
  isRunning: boolean
  workMinutes: number
  breakMinutes: number
}

const FIFTY_TWO_SEVENTEEN_DEFAULTS: FiftyTwoSeventeenState = {
  id: '5217',
  phase: 'work',
  remainingSeconds: 52 * 60,
  isRunning: false,
  workMinutes: 52,
  breakMinutes: 17,
}

export async function get5217State(): Promise<FiftyTwoSeventeenState> {
  const s = await idbGet<FiftyTwoSeventeenState>(STORE, '5217')
  return s ?? FIFTY_TWO_SEVENTEEN_DEFAULTS
}

export async function set5217State(state: FiftyTwoSeventeenState): Promise<void> {
  await idbPut(STORE, state)
}

export interface TimeboxBlock {
  id: string
  label: string
  durationMinutes: number
  order: number
}

export interface TimeboxState {
  id: 'timebox'
  blocks: TimeboxBlock[]
  currentIndex: number
  remainingSeconds: number
  isRunning: boolean
}

export async function getTimeboxState(): Promise<TimeboxState> {
  const s = await idbGet<TimeboxState>(STORE, 'timebox')
  return s ?? { id: 'timebox', blocks: [], currentIndex: 0, remainingSeconds: 0, isRunning: false }
}

export async function setTimeboxState(state: TimeboxState): Promise<void> {
  await idbPut(STORE, state)
}

export interface SpacedRepSession {
  id: string
  label: string
  scheduledDate: string
  completed: boolean
  completedAt?: number
}

export interface SpacedRepState {
  id: 'spacedrep'
  sessions: SpacedRepSession[]
}

export async function getSpacedRepState(): Promise<SpacedRepState> {
  const s = await idbGet<SpacedRepState>(STORE, 'spacedrep')
  return s ?? { id: 'spacedrep', sessions: [] }
}

export async function setSpacedRepState(state: SpacedRepState): Promise<void> {
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
