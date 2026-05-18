const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const ADMIN_TOKEN_KEY = 'studyhub_admin_token'

export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string | null) {
  if (token) sessionStorage.setItem(ADMIN_TOKEN_KEY, token)
  else sessionStorage.removeItem(ADMIN_TOKEN_KEY)
}

async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  const token = getAdminToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!response.ok) {
    const text = await response.text()
    let message = `Request failed with status ${response.status}`
    if (text) {
      try {
        const json = JSON.parse(text)
        message = json.error || json.message || text
      } catch {
        message = text
      }
    }
    throw new Error(message)
  }

  const text = await response.text()
  return text ? JSON.parse(text) : null
}

export async function adminLogin(username: string, password: string): Promise<void> {
  const result = await adminRequest<{ token: string }>('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
  setAdminToken(result.token)
}

export interface AdminUser {
  id: number
  email: string
  displayName: string
  createdAt: string
}

export async function getUsers(): Promise<AdminUser[]> {
  return adminRequest<AdminUser[]>('/api/admin/users')
}

export async function deleteUser(id: number): Promise<void> {
  return adminRequest(`/api/admin/users/${id}`, { method: 'DELETE' })
}

export async function changeUserPassword(id: number, password: string): Promise<void> {
  return adminRequest(`/api/admin/users/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  })
}
