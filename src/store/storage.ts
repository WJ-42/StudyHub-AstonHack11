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

export type Theme = 'light' | 'dark' | 'cyberpunk' | 'octopus' | 'pipboy' | 'lofi'
export const THEMES: Theme[] = ['light', 'dark', 'cyberpunk', 'octopus', 'pipboy', 'lofi']

export function getTheme(): Theme {
  const v = lsGet('theme')
  if (v === 'light' || v === 'dark' || v === 'cyberpunk' || v === 'octopus' || v === 'pipboy' || v === 'lofi') return v
  return 'light'
}

export function setTheme(theme: Theme): void {
  lsSet('theme', theme)
}

export type AppFont = 'dm-sans' | 'lora' | 'fraunces' | 'space-grotesk' | 'nunito'
export const FONTS: AppFont[] = ['dm-sans', 'lora', 'fraunces', 'space-grotesk', 'nunito']

const FONT_LABELS: Record<AppFont, string> = {
  'dm-sans': 'DM Sans',
  lora: 'Lora',
  fraunces: 'Fraunces',
  'space-grotesk': 'Space Grotesk',
  nunito: 'Nunito',
}

export function getFontLabel(font: AppFont): string {
  return FONT_LABELS[font]
}

const FONT_FAMILY_PREVIEW: Record<AppFont, string> = {
  'dm-sans': '"DM Sans", sans-serif',
  lora: 'Lora, Georgia, serif',
  fraunces: '"Fraunces", Georgia, serif',
  'space-grotesk': '"Space Grotesk", sans-serif',
  nunito: '"Nunito", sans-serif',
}

export function getFontFamilyPreview(font: AppFont): string {
  return FONT_FAMILY_PREVIEW[font]
}

export function getFont(): AppFont {
  const v = lsGet('font')
  if (v && FONTS.includes(v as AppFont)) return v as AppFont
  return 'dm-sans'
}

export function setFont(font: AppFont): void {
  lsSet('font', font)
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

const STUDY_LAST_MODE_KEY = 'study_last_mode'

export type StudyMode = 'pomodoro' | 'timer' | 'flashcards' | '5217' | 'timeboxing' | 'spacedrep'

export function getStudyLastMode(): StudyMode | null {
  const v = lsGet(STUDY_LAST_MODE_KEY)
  if (v && ['pomodoro', 'timer', 'flashcards', '5217', 'timeboxing', 'spacedrep'].includes(v)) return v as StudyMode
  return null
}

export function setStudyLastMode(mode: StudyMode): void {
  lsSet(STUDY_LAST_MODE_KEY, mode)
}

const REDUCE_MOTION_KEY = 'reduce_motion'

export function getReduceMotion(): boolean {
  const v = lsGet(REDUCE_MOTION_KEY)
  if (v === 'true' || v === 'false') return v === 'true'
  return false
}

export function setReduceMotion(value: boolean): void {
  lsSet(REDUCE_MOTION_KEY, value ? 'true' : 'false')
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

const RECENT_FILES_KEY = 'recent_files'

export interface RecentFile {
  fileId: string
  openedAt: number
}

/** Get recent files list (max 10). */
export function getRecentFiles(): RecentFile[] {
  try {
    const raw = lsGet(RECENT_FILES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as RecentFile[]
  } catch {
    return []
  }
}

/** Add a file to recent files list. */
export function addRecentFile(fileId: string): void {
  const recent = getRecentFiles()
  const existing = recent.find((r) => r.fileId === fileId)
  if (existing) {
    existing.openedAt = Date.now()
  } else {
    recent.push({ fileId, openedAt: Date.now() })
  }
  // Sort by most recent first, keep max 10
  recent.sort((a, b) => b.openedAt - a.openedAt)
  const trimmed = recent.slice(0, 10)
  lsSet(RECENT_FILES_KEY, JSON.stringify(trimmed))
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

const ANNOTATIONS_PREFIX = 'file_annotations_'

export interface FileAnnotation {
  id: string
  fileId: string
  type: 'note' | 'highlight'
  pageIndex?: number
  x?: number
  y?: number
  text?: string
  color?: string
  createdAt: number
  updatedAt?: number
}

export function getFileAnnotations(fileId: string): FileAnnotation[] {
  try {
    const raw = lsGet(ANNOTATIONS_PREFIX + fileId)
    if (!raw) return []
    return JSON.parse(raw) as FileAnnotation[]
  } catch {
    return []
  }
}

export function setFileAnnotations(fileId: string, annotations: FileAnnotation[]): void {
  lsSet(ANNOTATIONS_PREFIX + fileId, JSON.stringify(annotations))
}
