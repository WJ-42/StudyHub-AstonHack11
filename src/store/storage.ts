const DB_NAME = 'studyhub-db'
const DB_VERSION = 2
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
        ws.createIndex('workspaceId', 'workspaceId', { unique: false })
      } else if (db.objectStoreNames.contains('workspace')) {
        const ws = req.transaction!.objectStore('workspace')
        if (!ws.indexNames.contains('workspaceId')) {
          ws.createIndex('workspaceId', 'workspaceId', { unique: false })
        }
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

const WORKSPACE_EXPANDED_KEY = 'workspace_expanded'

export function getWorkspaceExpandedFolders(): Record<string, boolean> {
  try {
    const raw = lsGet(WORKSPACE_EXPANDED_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, boolean>
  } catch {
    return {}
  }
}

export function setWorkspaceExpandedFolders(expanded: Record<string, boolean>): void {
  lsSet(WORKSPACE_EXPANDED_KEY, JSON.stringify(expanded))
}

const SPOTIFY_TOKENS_KEY = 'spotify_tokens'

export interface SpotifyTokens {
  access_token: string
  expires_at: number
  refresh_token?: string
}

export function getSpotifyTokens(): SpotifyTokens | null {
  try {
    const raw = lsGet(SPOTIFY_TOKENS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SpotifyTokens
  } catch {
    return null
  }
}

export function setSpotifyTokens(tokens: SpotifyTokens): void {
  lsSet(SPOTIFY_TOKENS_KEY, JSON.stringify(tokens))
}

export function removeSpotifyTokens(): void {
  lsRemove(SPOTIFY_TOKENS_KEY)
}

const MEDIA_SPOTIFY_YOUTUBE_KEY = 'media_spotify_youtube'

/** YouTube videoId for "full version" player (Spotify dual-mode). Persisted so refresh restores. */
export function getMediaSpotifyYoutubeVideoId(): string | null {
  return lsGet(MEDIA_SPOTIFY_YOUTUBE_KEY)
}

export function setMediaSpotifyYoutubeVideoId(videoId: string): void {
  lsSet(MEDIA_SPOTIFY_YOUTUBE_KEY, videoId)
}

export function removeMediaSpotifyYoutubeVideoId(): void {
  lsRemove(MEDIA_SPOTIFY_YOUTUBE_KEY)
}

const SPOTIFY_YOUTUBE_CACHE_KEY = 'spotify_youtube_cache'

/** Last chosen YouTube videoId per normalized Spotify track URL. */
export function getSpotifyYoutubeCache(): Record<string, string> {
  try {
    const raw = lsGet(SPOTIFY_YOUTUBE_CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, string>
  } catch {
    return {}
  }
}

export function setSpotifyYoutubeCacheEntry(spotifyTrackUrl: string, videoId: string): void {
  const cache = getSpotifyYoutubeCache()
  cache[spotifyTrackUrl] = videoId
  lsSet(SPOTIFY_YOUTUBE_CACHE_KEY, JSON.stringify(cache))
}

const USER_AVATAR_KEY = 'user_avatar'

/** User profile picture as base64 data URL. */
export function getAvatar(): string | null {
  return lsGet(USER_AVATAR_KEY)
}

export function setAvatar(dataUrl: string | null): void {
  if (dataUrl == null) lsRemove(USER_AVATAR_KEY)
  else lsSet(USER_AVATAR_KEY, dataUrl)
}

export interface WorkspaceMeta {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

const WORKSPACE_LIST_KEY = 'workspace_list'
const ACTIVE_WORKSPACE_ID_KEY = 'active_workspace_id'

export function getWorkspaceList(): WorkspaceMeta[] {
  try {
    const raw = lsGet(WORKSPACE_LIST_KEY)
    if (!raw) return []
    return JSON.parse(raw) as WorkspaceMeta[]
  } catch {
    return []
  }
}

export function setWorkspaceList(list: WorkspaceMeta[]): void {
  lsSet(WORKSPACE_LIST_KEY, JSON.stringify(list))
}

export function getActiveWorkspaceId(): string | null {
  return lsGet(ACTIVE_WORKSPACE_ID_KEY)
}

export function setActiveWorkspaceId(id: string): void {
  lsSet(ACTIVE_WORKSPACE_ID_KEY, id)
}
