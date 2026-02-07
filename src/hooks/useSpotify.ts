import { useState, useEffect, useCallback } from 'react'
import { getSpotifyTokens } from '@/store/storage'
import { startSpotifyLogin, disconnectSpotify, getValidAccessToken, isSpotifyConfigured } from '@/services/spotifyAuth'
import { getCurrentUser, type SpotifyUser } from '@/services/spotifyApi'

export function useSpotify() {
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshConnection = useCallback(async () => {
    setError(null)
    const token = await getValidAccessToken()
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const profile = await getCurrentUser()
      setUser(profile)
    } catch (e) {
      setUser(null)
      setError(e instanceof Error ? e.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const tokens = getSpotifyTokens()
    if (!tokens) {
      setUser(null)
      setLoading(false)
      return
    }
    refreshConnection()
  }, [refreshConnection])

  const connect = useCallback(async () => {
    setError(null)
    const result = await startSpotifyLogin()
    if (!result.ok) setError(result.error ?? 'Login failed')
  }, [])

  const disconnect = useCallback(() => {
    disconnectSpotify()
    setUser(null)
    setError(null)
  }, [])

  const isConnected = !!user
  const isConfigured = isSpotifyConfigured()

  return {
    isConfigured,
    isConnected,
    user,
    loading,
    error,
    connect,
    disconnect,
    refreshConnection,
  }
}
