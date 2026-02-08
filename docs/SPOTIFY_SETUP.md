# Media: Spotify embed & YouTube full playback

## Spotify embed (no setup)

Paste any **Spotify link** (track, album, or playlist from `open.spotify.com`) in the Media Player Hub. The app will show the Spotify embed preview. No API key or login is required.

## YouTube full playback (optional)

To **auto-search YouTube** from a Spotify track link (e.g. “Play full version (YouTube)” in the Spotify + full playback card), set a YouTube Data API v3 key:

1. Get an API key at [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials).
2. Enable **YouTube Data API v3** for your project.
3. In the project root, create `.env` (or copy from `.env.example`) and set:

```env
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
```

Restart the dev server after changing `.env`. If the key is missing, you can still paste a YouTube video URL manually in the “Find on YouTube” modal.
