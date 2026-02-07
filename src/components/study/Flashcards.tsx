import { useState, useEffect, useCallback } from 'react'
import {
  getDecks,
  getCards,
  saveDeck,
  saveCard,
  deleteDeck,
  deleteCard,
  generateId,
  type FlashcardDeck,
  type Flashcard,
} from '@/store/study'

export function Flashcards() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([])
  const [cards, setCards] = useState<Flashcard[]>([])
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null)
  const [mode, setMode] = useState<'list' | 'study'>('list')
  const [studyIndex, setStudyIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([])
  const [newDeckName, setNewDeckName] = useState('')
  const [newCardFront, setNewCardFront] = useState('')
  const [newCardBack, setNewCardBack] = useState('')

  const loadDecks = useCallback(async () => {
    const d = await getDecks()
    setDecks(d)
  }, [])

  useEffect(() => {
    loadDecks()
  }, [loadDecks])

  useEffect(() => {
    if (!selectedDeckId) {
      setCards([])
      return
    }
    getCards(selectedDeckId).then(setCards)
  }, [selectedDeckId])

  useEffect(() => {
    if (mode === 'study' && cards.length > 0) {
      setShuffledOrder([...Array(cards.length).keys()].sort(() => Math.random() - 0.5))
      setStudyIndex(0)
      setFlipped(false)
    }
  }, [mode, cards.length])

  const selectedDeck = decks.find((d) => d.id === selectedDeckId)
  const studyCards = mode === 'study' && cards.length > 0
    ? shuffledOrder.map((i) => cards[i])
    : []
  const currentCard = studyCards[studyIndex]

  const handleCreateDeck = async () => {
    const name = newDeckName.trim() || 'New deck'
    const deck: FlashcardDeck = { id: generateId(), name, createdAt: Date.now() }
    await saveDeck(deck)
    setNewDeckName('')
    await loadDecks()
    setSelectedDeckId(deck.id)
  }

  const handleAddCard = async () => {
    if (!selectedDeckId) return
    const card: Flashcard = {
      id: generateId(),
      deckId: selectedDeckId,
      front: newCardFront.trim() || 'Front',
      back: newCardBack.trim() || 'Back',
    }
    await saveCard(card)
    setNewCardFront('')
    setNewCardBack('')
    const updated = await getCards(selectedDeckId)
    setCards(updated)
  }

  const handleDeleteDeck = async (id: string) => {
    if (!window.confirm('Delete this deck and all its cards?')) return
    await deleteDeck(id)
    if (selectedDeckId === id) setSelectedDeckId(null)
    await loadDecks()
  }

  const handleDeleteCard = async (id: string) => {
    await deleteCard(id)
    const updated = await getCards(selectedDeckId!)
    setCards(updated)
  }

  if (mode === 'study' && currentCard) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" className="text-sm text-blue-600 dark:text-blue-400" onClick={() => setMode('list')}>
            ← Back to decks
          </button>
          <span className="text-sm text-slate-500">{studyIndex + 1} / {studyCards.length}</span>
        </div>
        <div
          className="min-h-[200px] cursor-pointer rounded-lg border-2 border-slate-200 bg-slate-50 p-6 dark:border-slate-600 dark:bg-slate-700/50"
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setFlipped((f) => !f)}
        >
          <p className="text-lg text-slate-800 dark:text-slate-100">
            {flipped ? currentCard.back : currentCard.front}
          </p>
          <p className="mt-2 text-xs text-slate-500">{flipped ? 'Back' : 'Front'} (click to flip)</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-50 dark:border-slate-600"
            disabled={studyIndex === 0}
            onClick={() => { setStudyIndex((i) => i - 1); setFlipped(false) }}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-50 dark:border-slate-600"
            disabled={studyIndex === studyCards.length - 1}
            onClick={() => { setStudyIndex((i) => i + 1); setFlipped(false) }}
          >
            Next
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Flashcards</h3>
      <div className="mt-4 flex gap-2">
        <input
          type="text"
          placeholder="New deck name"
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          className="rounded border border-slate-300 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          aria-label="New deck name"
        />
        <button type="button" className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700" onClick={handleCreateDeck}>
          Create deck
        </button>
      </div>
      <div className="mt-4 flex gap-4">
        <div className="min-w-[200px]">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Decks</p>
          <ul className="mt-2 space-y-1">
            {decks.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className={`truncate text-left text-sm ${selectedDeckId === d.id ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}
                  onClick={() => setSelectedDeckId(d.id)}
                >
                  {d.name}
                </button>
                <button type="button" className="text-red-600 hover:underline" onClick={() => handleDeleteDeck(d.id)} aria-label="Delete deck">×</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex-1">
          {selectedDeck && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedDeck.name}</p>
                <button
                  type="button"
                  className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                  disabled={cards.length === 0}
                  onClick={() => setMode('study')}
                >
                  Study {cards.length > 0 && `(${cards.length})`}
                </button>
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Front"
                  value={newCardFront}
                  onChange={(e) => setNewCardFront(e.target.value)}
                  className="flex-1 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  aria-label="Card front"
                />
                <input
                  type="text"
                  placeholder="Back"
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                  className="flex-1 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  aria-label="Card back"
                />
                <button type="button" className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700" onClick={handleAddCard}>Add card</button>
              </div>
              <ul className="mt-4 space-y-2">
                {cards.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded border border-slate-200 p-2 dark:border-slate-600">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{c.front} → {c.back}</span>
                    <button type="button" className="text-red-600 hover:underline" onClick={() => handleDeleteCard(c.id)} aria-label="Delete card">×</button>
                  </li>
                ))}
              </ul>
              {cards.length === 0 && (
                <p className="mt-4 text-sm text-slate-500">No cards yet. Add a card above.</p>
              )}
            </>
          )}
          {!selectedDeck && decks.length > 0 && (
            <p className="text-sm text-slate-500">Select a deck to add cards or study.</p>
          )}
          {decks.length === 0 && (
            <p className="text-sm text-slate-500">Create a deck to get started.</p>
          )}
        </div>
      </div>
    </div>
  )
}
