import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateFlashcards } from '@/api/ai'
import { setToken } from '@/api/client'

describe('generateFlashcards', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setToken('test-token')
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls the correct endpoint with the provided text', async () => {
    const mockPairs = [{ front: 'Q1', back: 'A1' }, { front: 'Q2', back: 'A2' }]
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockPairs)),
    })

    const result = await generateFlashcards('some study notes')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ai/generate-flashcards'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(result).toEqual(mockPairs)
  })

  it('throws when the rate limit is hit', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('Daily limit of 5 AI generations reached. Try again tomorrow.'),
    })

    await expect(generateFlashcards('notes')).rejects.toThrow('Daily limit')
  })
})