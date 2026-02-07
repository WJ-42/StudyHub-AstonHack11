# Local data model

All data is stored in the browser. No backend or server.

## Storage choices

| Data | Storage | Notes |
|------|--------|--------|
| Session (logged in, optional display name) | localStorage | Simple key/value |
| Theme, compact mode, sidebar collapsed | localStorage | UI preferences |
| Workspace (folders, files, metadata) | IndexedDB | Tree: folders contain files; file content as text or base64 for DOCX/PDF |
| Open tabs, active tab id | IndexedDB | List of tab ids + active id |
| Study: Pomodoro config, custom timers state, flashcard decks/cards | IndexedDB | Structured by feature |
| Media: last used link per provider (Spotify, YouTube) | localStorage | One object with two keys |
| CSV: per-file chart prefs (x column, y column, chart type) | IndexedDB | Keyed by file id |

## Keys and shapes

### localStorage

- `studyapp_logged_in`: `"true"` when user has clicked Get Started.
- `studyapp_user_name`: optional display name (string).
- `studyapp_theme`: `"light"` | `"dark"` | `"sepia"`.
- `studyapp_compact`: `"true"` | `"false"`.
- `studyapp_sidebar_collapsed`: `"true"` | `"false"`.
- `studyapp_media_links`: JSON `{ spotify?: string, youtube?: string }`.
- `studyapp_media_spotify_youtube`: YouTube videoId for the “full version” player in the Spotify dual-mode card (persisted so refresh restores).
- `studyapp_spotify_tokens`: JSON `{ access_token, expires_at, refresh_token? }` (Spotify OAuth; cleared on Disconnect).

### IndexedDB (database name: `studyhub-db`)

- **workspace**: folders and files.
  - Folders: `{ id, name, parentId (null for root), createdAt }`.
  - Files: `{ id, folderId, name, fileType: "text"|"csv"|"docx"|"pdf"|"spotify", content (string; base64 for docx/pdf; JSON for spotify), createdAt, size?, updatedAt? }`.
  - DOCX size limit: 5 MB (raw file size). Larger files are rejected on import.
  - PDF size limit: 5 MB (raw file size). Larger files are rejected on import.
  - Spotify: fileType `"spotify"` with content = JSON of track metadata (source, trackId, trackUrl, name, artists, album, etc.). Read-only; used for “Import playlist as folder”.
- **tabs**: `{ openTabIds: string[], activeTabId: string | null }`.
- **study**: Pomodoro state, custom timer state, flashcard decks and cards (see store implementation).
- **csvPrefs**: `{ fileId: string, xColumn?: string, yColumn?: string, chartType?: "bar"|"line" }[]` or keyed by fileId.

All access goes through `src/store/` (storage.ts, session.ts, and feature-specific helpers). The app does not read or write localStorage/IndexedDB directly elsewhere.
