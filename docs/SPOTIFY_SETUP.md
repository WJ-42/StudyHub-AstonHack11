# Spotify Connect Setup (OAuth + Web API)

The app can connect to your Spotify account (frontend-only, no backend) to import **Liked Songs** and **playlists** into the Workspace as metadata. No client secret is used; authentication uses **Authorization Code with PKCE**.

## 1. Create a Spotify Developer app

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. Log in with your Spotify account.
3. Click **Create app**.
4. Fill in:
   - **App name**: e.g. "Study Hub" or your app name.
   - **App description**: optional.
   - **Redirect URI**: see below.
   - **Which API/SDKs are you planning to use?**: check **Web API**.
5. After creating, open the app and note the **Client ID**. You will **not** use the Client secret (frontend-only).

## 2. Redirect URIs

In the app settings, under **Redirect URIs**, add:

- **Local development**: `http://localhost:5173/app/spotify-callback`  
  (Adjust the port if your Vite dev server uses another, e.g. `5174`.)
- **Production** (if you deploy): `https://your-domain.com/app/spotify-callback`

Save the settings. Spotify only accepts redirects to URIs that are listed here.

## 3. Environment variables (Vite)

The app reads the Client ID and Redirect URI from environment variables so they are not committed to the repo.

1. In the project root, create a file named `.env` (or copy from `.env.example`).
2. Set:

```env
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/app/spotify-callback
```

- **VITE_SPOTIFY_CLIENT_ID**: The Client ID from the Spotify Developer Dashboard.
- **VITE_SPOTIFY_REDIRECT_URI**: Must match exactly one of the Redirect URIs configured in the Dashboard (including path and port).

For production, use a `.env.production` or your host’s env config with the production redirect URI.

Restart the dev server after changing `.env`.

## 4. Scopes used (and why)

The app requests the minimum scopes needed:

| Scope | Purpose |
|-------|--------|
| `user-read-private` | Read profile (display name, image) to show connected state. |
| `playlist-read-private` | List the user’s playlists and their tracks for import. |
| `user-library-read` | Read Liked Songs for import. |

No other scopes are requested. Playback (beyond any embed preview) is not implemented; that would require the Spotify Web Playback SDK and a Premium account.

## 5. Security notes

- **No client secret** is used or stored. PKCE is used so the app can authenticate without a secret.
- Tokens are stored in the browser (e.g. `localStorage` / `sessionStorage`). Use **Disconnect** to clear them.
- Do not commit `.env` or put your Client ID in public repos if you want to keep it private (the Client ID is visible in the built app).
