import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { api, getToken, setToken } from '@/api/client'

describe('api client', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setToken(null)
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('token management', () => {
    it('returns null initially', () => {
      expect(getToken()).toBeNull()
    })

    it('stores and returns a token', () => {
      setToken('test-token-123')
      expect(getToken()).toBe('test-token-123')
    })

    it('clears the token when set to null', () => {
      setToken('test-token')
      setToken(null)
      expect(getToken()).toBeNull()
    })
  })

  describe('api.post', () => {
    it('sends a POST request to the correct path', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(JSON.stringify({ success: true })),
      })

      await api.post('/api/test', { key: 'value' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('includes Content-Type header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('{}'),
      })

      await api.post('/api/test', {})

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('includes Authorization header when token is set', async () => {
      setToken('my-jwt-token')
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('{}'),
      })

      await api.post('/api/test', {})

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-jwt-token',
          }),
        })
      )
    })

    it('throws an error on a non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        text: () => Promise.resolve('Unauthorized'),
      })

      await expect(api.post('/api/test', {})).rejects.toThrow('Unauthorized')
    })
  })

  describe('api.get', () => {
    it('sends a GET request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('{}'),
      })

      await api.get('/api/test')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/test'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })
})