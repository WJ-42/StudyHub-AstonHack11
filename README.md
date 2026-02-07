# AstonHack11

A frontend-only study web app with a Trello-like look and feel. All data is stored locally in the browser (no backend or real authentication).

## Features

- **Landing page** — Marketing-style homepage with feature tiles and Get Started / Login (fake login).
- **Workspace** — Create folders, import files, open files in tabs. Rename and delete items.
- **Document editor** — Edit text files with optional Markdown preview. Edit CSV as text.
- **CSV Visualizer** — Select a CSV from workspace; view table and bar/line charts with column pickers. Settings persist per file.
- **Study modes** — Pomodoro (work/short/long break), custom timer, and flashcards (decks, cards, study with flip/next/prev and shuffle).
- **Media hub** — Paste Spotify or YouTube links; embed preview. Last link per provider is saved.
- **Settings** — Theme (Light, Dark, Sepia), compact mode, sidebar collapse. All persist locally.
- **Search** — Top bar search filters workspace items by name.
- **Responsive** — Sidebar collapses to hamburger menu on small screens.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173. Click **Get Started** to enter the app (no real login).

## Build

```bash
npm run build
npm run preview
```
