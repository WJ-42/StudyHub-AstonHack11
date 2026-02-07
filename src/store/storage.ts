const DB_NAME = 'studyhub-db'
const DB_VERSION = 1
const STORES = ['workspace', 'tabs', 'study', 'csvPrefs'] as const

let dbPromise: Promise<IDBDatabase> | null = null

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('workspace')) {
        const ws = db.createObjectStore('workspace', { keyPath: 'id' })
        ws.createIndex('kind', 'kind', { unique: false })
        ws.createIndex('folderId', 'folderId', { unique: false })
        ws.createIndex('parentId', 'parentId', { unique: false })
      }
      if (!db.objectStoreNames.contains('tabs')) {
        db.createObjectStore('tabs', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('study')) {
        db.createObjectStore('study', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('csvPrefs')) {
        db.createObjectStore('csvPrefs', { keyPath: 'fileId' })
      }
    }
  })
  return dbPromise
}

export async function idbGet<T>(store: typeof STORES[number], key: string): Promise<T | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result as T | undefined)
    req.onerror = () => reject(req.error)
  })
}

export async function idbGetAll<T>(store: typeof STORES[number]): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const req = tx.objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

export async function idbGetByIndex<T>(store: typeof STORES[number], indexName: string, value: string | null): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readonly')
    const os = tx.objectStore(store)
    const index = os.index(indexName)
    const req = index.getAll(value)
    req.onsuccess = () => resolve(req.result as T[])
    req.onerror = () => reject(req.error)
  })
}

export async function idbPut(store: typeof STORES[number], value: object): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).put(value)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function idbDelete(store: typeof STORES[number], key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const req = tx.objectStore(store).delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

const LS_PREFIX = 'studyapp_'

export function lsGet(key: string): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(LS_PREFIX + key)
}

export function lsSet(key: string, value: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_PREFIX + key, value)
}

export function lsRemove(key: string): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(LS_PREFIX + key)
}

export type Theme = 'light' | 'dark' | 'sepia'
export const THEMES: Theme[] = ['light', 'dark', 'sepia']

export function getTheme(): Theme {
  const v = lsGet('theme')
  if (v === 'light' || v === 'dark' || v === 'sepia') return v
  return 'light'
}

export function setTheme(theme: Theme): void {
  lsSet('theme', theme)
}

export function getCompact(): boolean {
  return lsGet('compact') === 'true'
}

export function setCompact(value: boolean): void {
  lsSet('compact', value ? 'true' : 'false')
}

export function getSidebarCollapsed(): boolean {
  return lsGet('sidebar_collapsed') === 'true'
}

export function setSidebarCollapsed(value: boolean): void {
  lsSet('sidebar_collapsed', value ? 'true' : 'false')
}

export interface MediaLinks {
  spotify?: string
  appleMusic?: string
  youtube?: string
}

export function getMediaLinks(): MediaLinks {
  try {
    const raw = lsGet('media_links')
    if (!raw) return {}
    return JSON.parse(raw) as MediaLinks
  } catch {
    return {}
  }
}

export function setMediaLinks(links: MediaLinks): void {
  lsSet('media_links', JSON.stringify(links))
}
