import { describe, it, expect, beforeEach } from 'vitest'
import { isLoggedIn, setLoggedIn, getUserName, setUserName, logout } from '@/store/session'

describe('session', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('isLoggedIn', () => {
    it('returns false when nothing is set', () => {
      expect(isLoggedIn()).toBe(false)
    })

    it('returns true after setLoggedIn(true)', () => {
      setLoggedIn(true)
      expect(isLoggedIn()).toBe(true)
    })

    it('returns false after setLoggedIn(false)', () => {
      setLoggedIn(true)
      setLoggedIn(false)
      expect(isLoggedIn()).toBe(false)
    })
  })

  describe('getUserName', () => {
    it('returns null when no name is set', () => {
      expect(getUserName()).toBeNull()
    })

    it('returns the name after setUserName', () => {
      setUserName('Waleed')
      expect(getUserName()).toBe('Waleed')
    })
  })

  describe('logout', () => {
    it('clears the logged in flag', () => {
      setLoggedIn(true)
      logout()
      expect(isLoggedIn()).toBe(false)
    })

    it('clears the user name', () => {
      setUserName('Waleed')
      logout()
      expect(getUserName()).toBeNull()
    })
  })
})