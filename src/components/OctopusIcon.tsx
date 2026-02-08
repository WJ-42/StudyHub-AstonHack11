import { useState } from 'react'

/** Octopus logo for the octopus theme. Uses PNG from public/octopus-theme/octopus.png if present, else SVG fallback. */
export function OctopusIcon({ className }: { className?: string }) {
  const [useFallback, setUseFallback] = useState(false)

  if (useFallback) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
      >
        <ellipse cx="12" cy="10" rx="6" ry="5" />
        <circle cx="9" cy="9" r="1.2" />
        <circle cx="15" cy="9" r="1.2" />
        <path d="M7 14 Q5 18 6 20 Q7 19 8 16" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M10 14 Q8 19 9 21 Q10 20 11 17" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M12 15 Q12 20 12 22 Q12 21 12 18" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M14 14 Q16 19 15 21 Q14 20 13 17" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M17 14 Q19 18 18 20 Q17 19 16 16" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <img
      src="/octopus-theme/octopus.png"
      alt=""
      className={className}
      aria-hidden
      onError={() => setUseFallback(true)}
    />
  )
}
