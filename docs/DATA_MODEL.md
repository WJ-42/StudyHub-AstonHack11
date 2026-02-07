# Local data model

All data is stored in the browser. No backend or server.

## Storage choices

| Data | Storage | Notes |
|------|--------|--------|
| Session (logged in, optional display name) | localStorage | Simple key/value |
| Theme, compact mode, sidebar collapsed | localStorage | UI preferences |
| Workspace (folders, files, metadata) | IndexedDB | Tree: folders contain files; file content as text or base64 for DOCX |
| Open tabs, active tab id | IndexedDB | List of tab ids + active id |
| Study: Pomodoro config, custom timers state, flashcard decks/cards | IndexedDB | Structured by feature |
| Media: last used link per provider (Spotify, Apple Music, YouTube) | localStorage | One object with three keys |
| CSV: per-file chart prefs (x column, y column, chart type) | IndexedDB | Keyed by file id |

## Keys and shapes

### localStorage

- `studyapp_logged_in`: `"true"` when user has clicked Get Started.
- `studyapp_user_name`: optional display name (string).
- `studyapp_theme`: `"light"` | `"dark"` | `"sepia"`.
- `studyapp_compact`: `"true"` | `"false"`.
- `studyapp_sidebar_collapsed`: `"true"` | `"false"`.
- `studyapp_media_links`: JSON `{ spotify?: string, appleMusic?: string, youtube?: string }`.

### IndexedDB (database name: `studyhub-db`)

- **workspace**: folders and files.
  - Folders: `{ id, name, parentId (null for root), createdAt }`.
  - Files: `{ id, folderId, name, fileType: "text"|"csv"|"docx", content (string; base64 for docx), createdAt, size?, updatedAt? }`.
  - DOCX size limit: 5 MB (raw file size). Larger files are rejected on import.
- **tabs**: `{ openTabIds: string[], activeTabId: string | null }`.
- **study**: Pomodoro state, custom timer state, flashcard decks and cards (see store implementation).
- **csvPrefs**: `{ fileId: string, xColumn?: string, yColumn?: string, chartType?: "bar"|"line" }[]` or keyed by fileId.

All access goes through `src/store/` (storage.ts, session.ts, and feature-specific helpers). The app does not read or write localStorage/IndexedDB directly elsewhere.
