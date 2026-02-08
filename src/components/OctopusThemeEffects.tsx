import { useEffect, useRef, useState, useCallback } from 'react'
import { useSettings } from '@/contexts/SettingsContext'

const AMBIENT_BUBBLE_COUNT = 14
const CURSOR_BUBBLE_MAX = 10
const CURSOR_BUBBLE_MS = 2000
const MOUSE_THROTTLE_MS = 120

function useThrottle(fn: (x: number, y: number) => void, ms: number): (x: number, y: number) => void {
  const last = useRef(0)
  const raf = useRef<number | null>(null)
  const fnRef = useRef(fn)
  const pendingRef = useRef<{ x: number; y: number } | null>(null)
  fnRef.current = fn
  return useCallback(
    (clientX: number, clientY: number) => {
      pendingRef.current = { x: clientX, y: clientY }
      const now = Date.now()
      const elapsed = now - last.current
      if (elapsed >= ms) {
        last.current = now
        const p = pendingRef.current
        if (p) fnRef.current(p.x, p.y)
        return
      }
      if (raf.current === null) {
        raf.current = requestAnimationFrame(() => {
          raf.current = null
          last.current = Date.now()
          const p = pendingRef.current
          if (p) fnRef.current(p.x, p.y)
        })
      }
    },
    [ms]
  )
}

type CursorBubble = { id: number; x: number; y: number }

export function OctopusThemeEffects() {
  const { theme, reduceMotion } = useSettings()
  const [cursorBubbles, setCursorBubbles] = useState<CursorBubble[]>([])
  const idRef = useRef(0)
  const removeTimeoutRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const addCursorBubble = useThrottle(
    useCallback((clientX: number, clientY: number) => {
      if (reduceMotion) return
      const id = ++idRef.current
      const x = clientX + (Math.random() - 0.5) * 24
      const y = clientY + (Math.random() - 0.5) * 24
      setCursorBubbles((prev) => {
        const next = [...prev, { id, x, y }].slice(-CURSOR_BUBBLE_MAX)
        return next
      })
      const t = setTimeout(() => {
        removeTimeoutRef.current.delete(id)
        setCursorBubbles((prev) => prev.filter((b) => b.id !== id))
      }, CURSOR_BUBBLE_MS)
      removeTimeoutRef.current.set(id, t)
    }, [reduceMotion]),
    MOUSE_THROTTLE_MS
  )

  useEffect(() => {
    const handler = (e: MouseEvent) => addCursorBubble(e.clientX, e.clientY)
    window.addEventListener('mousemove', handler)
    return () => {
      window.removeEventListener('mousemove', handler)
      removeTimeoutRef.current.forEach((t) => clearTimeout(t))
      removeTimeoutRef.current.clear()
    }
  }, [addCursorBubble])

  /* Apply tentacle cursor via JS so the image URL resolves (public/cursors/tentacle.png) */
  useEffect(() => {
    if (theme !== 'octopus') {
      const el = document.getElementById('octopus-cursor-style')
      if (el) el.remove()
      return
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/cursors/tentacle.png`
    let el = document.getElementById('octopus-cursor-style') as HTMLStyleElement | null
    if (!el) {
      el = document.createElement('style')
      el.id = 'octopus-cursor-style'
      document.head.appendChild(el)
    }
    el.textContent = `
      .theme-octopus, .theme-octopus * { cursor: url("${url}") 2 2, auto !important; }
      .theme-octopus a, .theme-octopus button, .theme-octopus [role="button"],
      .theme-octopus [type="submit"], .theme-octopus input[type="image"],
      .theme-octopus [tabindex]:not([tabindex="-1"]) { cursor: url("${url}") 2 2, pointer !important; }
      html.theme-octopus.reduce-motion,
      html.theme-octopus.reduce-motion * { cursor: auto !important; }
      html.theme-octopus.reduce-motion a,
      html.theme-octopus.reduce-motion button,
      html.theme-octopus.reduce-motion [role="button"] { cursor: pointer !important; }
    `
    return () => {
      const s = document.getElementById('octopus-cursor-style')
      if (s) s.remove()
    }
  }, [theme])

  if (theme !== 'octopus') return null

  const showBubbles = !reduceMotion

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {showBubbles && (
        <>
          {/* Ambient bubbles */}
          {Array.from({ length: AMBIENT_BUBBLE_COUNT }, (_, i) => {
            const size = 4 + (i % 9)
            const left = (i * 7 + 13) % 100
            const duration = 8 + (i % 8)
            const delay = (i * 0.8) % 6
            return (
              <div
                key={`ambient-${i}`}
                className="octopus-bubble-float absolute bottom-0 rounded-full bg-white/60 shadow-[0_0_6px_rgba(255,255,255,0.5)]"
                style={{
                  width: size,
                  height: size,
                  left: `${left}%`,
                  animation: `octopus-bubble-float ${duration}s ease-in infinite`,
                  animationDelay: `${delay}s`,
                }}
              />
            )
          })}
          {/* Cursor bubbles */}
          {cursorBubbles.map((b) => (
            <div
              key={b.id}
              className="octopus-bubble-float absolute rounded-full bg-white/70 shadow-[0_0_4px_rgba(255,255,255,0.6)]"
              style={{
                width: 6,
                height: 6,
                left: b.x,
                top: b.y,
                transform: 'translate(-50%, -50%)',
                animation: `octopus-bubble-float 2s ease-in forwards`,
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}
