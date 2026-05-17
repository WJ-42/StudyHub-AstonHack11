import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { login, register, logout } from '@/api/auth'
import { getToken, setToken } from '@/api/client'

describe('auth', () => {
  let mockFetch: ReturnType<typeof vi.fn>

  beforeEach(() => {
    setToken(null)
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('login calls the login endpoint and sets the token', async () => {
    const mockResponse = { token: 'jwt-token', email: 'test@test.com', displayName: 'Test User' }
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    })

    const result = await login('test@test.com', 'password123')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/login'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(result.token).toBe('jwt-token')
    expect(getToken()).toBe('jwt-token')
  })

  it('register calls the register endpoint and sets the token', async () => {
    const mockResponse = { token: 'jwt-token', email: 'new@test.com', displayName: 'New User' }
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify(mockResponse)),
    })

    const result = await register('new@test.com', 'password123', 'New User')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/register'),
      expect.objectContaining({ method: 'POST' })
    )
    expect(result.email).toBe('new@test.com')
    expect(getToken()).toBe('jwt-token')
  })

  it('login throws when credentials are wrong', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('Invalid credentials'),
    })

    await expect(login('bad@email.com', 'wrongpass')).rejects.toThrow('Invalid credentials')
  })

  it('logout clears the token', () => {
    setToken('existing-token')
    logout()
    expect(getToken()).toBeNull()
  })
})