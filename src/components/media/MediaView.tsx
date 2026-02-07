import { useState, useEffect } from 'react'
import { getMediaLinks, setMediaLinks } from '@/store/storage'

type Provider = 'spotify' | 'appleMusic' | 'youtube'

function getEmbedUrl(provider: Provider, url: string): string | null {
  try {
    const u = new URL(url.trim())
    if (provider === 'spotify') {
      if (u.hostname.includes('open.spotify.com')) {
        const path = u.pathname + u.search
        return `https://open.spotify.com/embed${path}`
      }
      return null
    }
    if (provider === 'appleMusic') {
      if (u.hostname.includes('music.apple.com')) {
        const path = u.pathname + u.search
        return `https://embed.music.apple.com${path}`
      }
      return null
    }
    if (provider === 'youtube') {
      let vid = u.searchParams.get('v')
      if (!vid && u.hostname === 'youtu.be') vid = u.pathname.slice(1)
      if (vid) return `https://www.youtube.com/embed/${vid}`
      return null
    }
  } catch {
    return null
  }
  return null
}

function MediaBlock({
  title,
  subtitle,
  provider,
  storageKey,
}: {
  title: string
  subtitle?: string
  provider: Provider
  storageKey: keyof ReturnType<typeof getMediaLinks>
}) {
  const links = getMediaLinks()
  const saved = links[storageKey] ?? ''
  const [input, setInput] = useState(saved)
  const [embedUrl, setEmbedUrl] = useState<string | null>(null)

  useEffect(() => {
    setInput(saved)
    if (saved) {
      const embed = getEmbedUrl(provider, saved)
      setEmbedUrl(embed)
    } else {
      setEmbedUrl(null)
    }
  }, [saved, provider])

  const handleLoad = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    const embed = getEmbedUrl(provider, trimmed)
    if (embed) {
      setEmbedUrl(embed)
      const next = { ...getMediaLinks(), [storageKey]: trimmed }
      setMediaLinks(next)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
      {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      <div className="mt-2 flex gap-2">
        <input
          type="url"
          placeholder={`Paste ${title} link...`}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
          aria-label={`${title} URL`}
        />
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={handleLoad}
        >
          Load
        </button>
      </div>
      {embedUrl && (
        <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
          <iframe
            title={title}
            src={embedUrl}
            className="h-full w-full"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          />
        </div>
      )}
    </div>
  )
}

export function MediaView() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Media Player Hub</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Playback and volume controls are handled by the provider embed.
      </p>
      <MediaBlock title="Spotify (embed preview)" provider="spotify" storageKey="spotify" />
      <MediaBlock title="Apple Music" provider="appleMusic" storageKey="appleMusic" />
      <MediaBlock title="YouTube" provider="youtube" storageKey="youtube" />
    </div>
  )
}
