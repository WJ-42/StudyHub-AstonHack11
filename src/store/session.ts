import { lsGet, lsSet, lsRemove } from './storage'
import { setAvatar } from './storage'

export function isLoggedIn(): boolean {
  return lsGet('logged_in') === 'true'
}

export function setLoggedIn(value: boolean): void {
  if (value) lsSet('logged_in', 'true')
  else lsRemove('logged_in')
}

export function getUserName(): string | null {
  return lsGet('user_name')
}

export function setUserName(name: string): void {
  lsSet('user_name', name)
}

export function logout(): void {
  lsRemove('logged_in')
  lsRemove('user_name')
  setAvatar(null)
}
