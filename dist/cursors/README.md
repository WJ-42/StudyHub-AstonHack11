# Custom cursors (Octopus theme)

Add your tentacle cursor image here so the Octopus theme can use it.

## File

- **Path:** `public/cursors/tentacle.png` (this folder)
- **Filename:** must be exactly `tentacle.png`
- **Format:** PNG with transparent background. Avoid JPEG.

## What to check if the cursor does not show

1. **File is in the right place**  
   The file must be at `public/cursors/tentacle.png`. The app loads it as `/cursors/tentacle.png` (when running with `npm run dev` or when the built app is served from the project root).

2. **Size**  
   Use **32×32 pixels** (or 24×24). Windows and some other systems ignore custom cursors larger than 32×32. If your image is bigger, resize it to 32×32.

3. **Run with a real server**  
   Use `npm run dev` or `npm run preview` and open the URL in the browser. Do **not** open `dist/index.html` directly with `file://` — the cursor path may not resolve.

4. **Browser**  
   Custom `cursor: url()` images are supported in Chrome, Firefox, Edge, Safari. Try another browser if one doesn’t show it.

5. **Reduce motion**  
   If “Reduce motion” is on in Settings, the app may fall back to the default cursor. Turn it off to test.

6. **Hotspot**  
   The click point is set to (2, 2). To change it, edit `src/components/OctopusThemeEffects.tsx` and change the two numbers after the URL, e.g. `cursor: url("...") 16 16, auto` for a 32×32 image with tip at centre.

If the file is missing or too large, the theme falls back to the default system cursor.
