import { useEffect, useRef, useState, useCallback } from 'react'
import { useSettings } from '@/contexts/SettingsContext'

const AMBIENT_BUBBLE_COUNT = 14
const CURSOR_BUBBLE_MAX = 12
const MOUSE_THROTTLE_MS = 130

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

type CursorBubble = {
  id: number
  x: number
  y: number
  size: number
  duration: number
}

export function OctopusThemeEffects() {
  const { theme, reduceMotion } = useSettings()
  const [cursorBubbles, setCursorBubbles] = useState<CursorBubble[]>([])
  const idRef = useRef(0)
  const removeTimeoutRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const addCursorBubble = useThrottle(
    useCallback((clientX: number, clientY: number) => {
      if (reduceMotion) return
      const id = ++idRef.current
      // Small random offset so bubbles do not all stack exactly on the cursor
      const x = clientX + (Math.random() - 0.5) * 16
      const y = clientY + (Math.random() - 0.5) * 16
      const size = 5 + Math.random() * 7
      const duration = 1.0 + Math.random() * 0.7
      setCursorBubbles((prev) => {
        const next = [...prev, { id, x, y, size, duration }].slice(-CURSOR_BUBBLE_MAX)
        return next
      })
      const removeDelay = Math.round(duration * 1000) + 150
      const t = setTimeout(() => {
        removeTimeoutRef.current.delete(id)
        setCursorBubbles((prev) => prev.filter((b) => b.id !== id))
      }, removeDelay)
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

  if (theme !== 'octopus') return null

  const showBubbles = !reduceMotion

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
    >
      {showBubbles && (
        <>
          {/* Ambient bubbles rising from the bottom of the screen */}
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
          {/* Cursor bubbles: pop at cursor and rise straight upward */}
          {cursorBubbles.map((b) => (
            <div
              key={b.id}
              className="octopus-cursor-bubble absolute rounded-full bg-white/75 shadow-[0_0_5px_rgba(255,255,255,0.65)]"
              style={{
                width: b.size,
                height: b.size,
                left: b.x,
                top: b.y,
                animation: `octopus-cursor-bubble ${b.duration}s ease-out forwards`,
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}
