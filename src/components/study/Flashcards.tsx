import { useState, useEffect, useCallback } from 'react'
import {
  getDecks,
  getCards,
  saveDeck,
  saveCard,
  deleteDeck,
  deleteCard,
  generateId,
  getDeckColor,
  DECK_COLOR_PALETTE,
  type FlashcardDeck,
  type Flashcard,
} from '@/store/study'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { generateFlashcards, type FlashcardPair } from '@/api/ai'
import { useAuth } from '@/contexts/AuthContext'

function AIGenerateModal({
  deckName,
  onClose,
  onAdd,
}: {
  deckName: string
  onClose: () => void
  onAdd: (pairs: FlashcardPair[]) => void
}) {
  const [text, setText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [pairs, setPairs] = useState<FlashcardPair[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'input' | 'preview'>('input')

  const handleGenerate = async () => {
    if (!text.trim()) return
    setGenerating(true)
    setError(null)
    try {
      const result = await generateFlashcards(text.trim())
      setPairs(result)
      setSelected(new Set(result.map((_, i) => i)))
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards')
    } finally {
      setGenerating(false)
    }
  }

  const toggleCard = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Generate flashcards with AI
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {step === 'input'
            ? `Cards will be added to "${deckName}"`
            : `${pairs.length} cards generated. Select which ones to add to "${deckName}".`}
        </p>

        {step === 'input' && (
          <>
            <textarea
              className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
              rows={8}
              placeholder="Paste your notes or study material here..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
            <button
              type="button"
              disabled={!text.trim() || generating}
              onClick={handleGenerate}
              className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
              {pairs.map((pair, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 cursor-pointer rounded-lg border border-slate-200 p-3 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(i)}
                    onChange={() => toggleCard(i)}
                    className="mt-0.5 shrink-0"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {pair.front}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {pair.back}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm dark:border-slate-600"
              >
                Back
              </button>
              <button
                type="button"
                disabled={selected.size === 0}
                onClick={() => onAdd(pairs.filter((_, i) => selected.has(i)))}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Add {selected.size} card{selected.size !== 1 ? 's' : ''} to deck
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function Flashcards() {
  const { isLoggedIn } = useAuth()
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
  const [pendingDeleteDeckId, setPendingDeleteDeckId] = useState<string | null>(null)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [editFront, setEditFront] = useState('')
  const [editBack, setEditBack] = useState('')
  const [aiModalOpen, setAiModalOpen] = useState(false)

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
  const studyCards =
    mode === 'study' && cards.length > 0 ? shuffledOrder.map((i) => cards[i]) : []
  const currentCard = studyCards[studyIndex]

  // Resolve the color pair for whichever deck is currently selected
  const deckColors = getDeckColor(selectedDeck?.colorIndex)

  const handleCreateDeck = async () => {
    const name = newDeckName.trim() || 'New deck'
    // Assign the next color in the palette by cycling through based on how many decks exist
    const colorIndex = decks.length % DECK_COLOR_PALETTE.length
    const deck: FlashcardDeck = { id: generateId(), name, createdAt: Date.now(), colorIndex }
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

  const handleDeleteDeckClick = (id: string) => {
    setPendingDeleteDeckId(id)
  }

  const handleDeleteDeckConfirm = async () => {
    const id = pendingDeleteDeckId
    setPendingDeleteDeckId(null)
    if (!id) return
    await deleteDeck(id)
    if (selectedDeckId === id) setSelectedDeckId(null)
    await loadDecks()
  }

  const handleDeleteCard = async (id: string) => {
    await deleteCard(id)
    const updated = await getCards(selectedDeckId!)
    setCards(updated)
  }

  const handleEditCard = (card: Flashcard) => {
    setEditingCardId(card.id)
    setEditFront(card.front)
    setEditBack(card.back)
  }

  const handleSaveEdit = async () => {
    if (!editingCardId || !selectedDeckId) return
    const card = cards.find((c) => c.id === editingCardId)
    if (!card) return
    const updated: Flashcard = {
      ...card,
      front: editFront.trim() || 'Front',
      back: editBack.trim() || 'Back',
    }
    await saveCard(updated)
    setEditingCardId(null)
    const refreshed = await getCards(selectedDeckId)
    setCards(refreshed)
  }

  const handleCancelEdit = () => {
    setEditingCardId(null)
    setEditFront('')
    setEditBack('')
  }

  const handleAddAICards = async (pairs: FlashcardPair[]) => {
    if (!selectedDeckId) return
    for (const pair of pairs) {
      const card: Flashcard = {
        id: generateId(),
        deckId: selectedDeckId,
        front: pair.front,
        back: pair.back,
      }
      await saveCard(card)
    }
    const updated = await getCards(selectedDeckId)
    setCards(updated)
    setAiModalOpen(false)
  }

  // Study mode: full-screen card with deck colors
  if (mode === 'study' && currentCard) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            className="text-sm text-blue-600 dark:text-blue-400"
            onClick={() => setMode('list')}
          >
            ← Back to decks
          </button>
          <span className="text-sm text-slate-500">
            {studyIndex + 1} / {studyCards.length}
          </span>
        </div>
        <div
          className="min-h-[200px] cursor-pointer select-none rounded-xl p-6 shadow-md transition-colors duration-300"
          style={{ backgroundColor: flipped ? deckColors.back : deckColors.front }}
          onClick={() => setFlipped((f) => !f)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setFlipped((f) => !f)
            }
          }}
        >
          <p className="text-lg font-medium text-white">
            {flipped ? currentCard.back : currentCard.front}
          </p>
          <p className="mt-2 text-xs text-white/60">
            {flipped ? 'Back' : 'Front'} — click to flip
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-50 dark:border-slate-600"
            disabled={studyIndex === 0}
            onClick={() => {
              setStudyIndex((i) => i - 1)
              setFlipped(false)
            }}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-lg border border-slate-300 px-4 py-2 disabled:opacity-50 dark:border-slate-600"
            disabled={studyIndex === studyCards.length - 1}
            onClick={() => {
              setStudyIndex((i) => i + 1)
              setFlipped(false)
            }}
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

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="New deck name"
          value={newDeckName}
          onChange={(e) => setNewDeckName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCreateDeck() }}
          className="rounded border border-slate-300 px-3 py-1.5 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          aria-label="New deck name"
        />
        <button
          type="button"
          className="rounded bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700"
          onClick={handleCreateDeck}
        >
          Create deck
        </button>
        {isLoggedIn && selectedDeck && (
          <button
            type="button"
            className="rounded bg-purple-600 px-3 py-1.5 text-white hover:bg-purple-700"
            onClick={() => setAiModalOpen(true)}
          >
            Generate with AI
          </button>
        )}
        {isLoggedIn && !selectedDeck && decks.length > 0 && (
          <span className="self-center text-xs text-slate-400">
            Select a deck to use AI generation
          </span>
        )}
        {!isLoggedIn && (
          <span className="self-center text-xs text-slate-400">
            Login to use AI generation
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-4">
        <div className="min-w-[200px]">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Decks</p>
          <ul className="mt-2 space-y-1">
            {decks.map((d) => {
              const colors = getDeckColor(d.colorIndex)
              return (
                <li key={d.id} className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className={`flex min-w-0 items-center gap-2 truncate text-left text-sm ${
                      selectedDeckId === d.id
                        ? 'font-medium text-slate-800 dark:text-slate-100'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                    onClick={() => setSelectedDeckId(d.id)}
                  >
                    {/* Colored dot indicating this deck's assigned color */}
                    <span
                      className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: colors.front }}
                    />
                    <span className="truncate">{d.name}</span>
                  </button>
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    onClick={() => handleDeleteDeckClick(d.id)}
                    aria-label="Delete deck"
                  >
                    ×
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="flex-1">
          {selectedDeck && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  {/* Color swatch showing this deck's front/back colors */}
                  <div className="flex gap-1">
                    <span
                      className="inline-block h-4 w-4 rounded-sm"
                      style={{ backgroundColor: deckColors.front }}
                      title="Front color"
                    />
                    <span
                      className="inline-block h-4 w-4 rounded-sm"
                      style={{ backgroundColor: deckColors.back }}
                      title="Back color"
                    />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedDeck.name}
                  </p>
                </div>
                <div className="ml-auto flex gap-2">
                  {isLoggedIn && (
                    <button
                      type="button"
                      className="rounded bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-700"
                      onClick={() => setAiModalOpen(true)}
                    >
                      Generate with AI
                    </button>
                  )}
                  <button
                    type="button"
                    className="rounded bg-green-600 px-3 py-1.5 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                    disabled={cards.length === 0}
                    onClick={() => setMode('study')}
                  >
                    Study {cards.length > 0 && `(${cards.length})`}
                  </button>
                </div>
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
                <button
                  type="button"
                  className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                  onClick={handleAddCard}
                >
                  Add card
                </button>
              </div>

              <ul className="mt-4 space-y-2">
                {cards.map((c) => (
                  <li
                    key={c.id}
                    className="rounded border border-slate-200 p-2 dark:border-slate-600"
                    style={{ borderLeftColor: deckColors.front, borderLeftWidth: 3 }}
                  >
                    {editingCardId === c.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editFront}
                          onChange={(e) => setEditFront(e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                          placeholder="Front"
                        />
                        <input
                          type="text"
                          value={editBack}
                          onChange={(e) => setEditBack(e.target.value)}
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                          placeholder="Back"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                            onClick={handleSaveEdit}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="rounded border border-slate-300 px-3 py-1 text-sm dark:border-slate-600"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {c.front} → {c.back}
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-blue-600 hover:underline dark:text-blue-400"
                            onClick={() => handleEditCard(c)}
                            aria-label="Edit card"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={() => handleDeleteCard(c.id)}
                            aria-label="Delete card"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
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

      {aiModalOpen && selectedDeck && (
        <AIGenerateModal
          deckName={selectedDeck.name}
          onClose={() => setAiModalOpen(false)}
          onAdd={handleAddAICards}
        />
      )}

      <ConfirmModal
        open={pendingDeleteDeckId !== null}
        title="Delete deck"
        message={
          pendingDeleteDeckId
            ? `Delete deck "${decks.find((d) => d.id === pendingDeleteDeckId)?.name ?? 'Unknown'}" and all its cards? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteDeckConfirm}
        onCancel={() => setPendingDeleteDeckId(null)}
      />
    </div>
  )
}
