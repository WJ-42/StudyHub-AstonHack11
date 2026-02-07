import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { exchangeCodeForTokens } from '@/services/spotifyAuth'

export function SpotifyCallback() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'pending' | 'ok' | 'error'>('pending')
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const errorParam = searchParams.get('error')

    if (errorParam) {
      const desc = searchParams.get('error_description') ?? errorParam
      setMessage(desc === 'access_denied' ? 'You denied access. You can connect again from Media.' : desc)
      setStatus('error')
      const t = setTimeout(() => navigate('/app/media', { replace: true, state: { spotifyError: true } }), 2500)
      return () => clearTimeout(t)
    }

    if (!code || !state) {
      setMessage('Missing code or state. Try connecting again from Media.')
      setStatus('error')
      const t = setTimeout(() => navigate('/app/media', { replace: true }), 2500)
      return () => clearTimeout(t)
    }

    let cancelled = false
    exchangeCodeForTokens(code, state).then((result) => {
      if (cancelled) return
      if (result.ok) {
        setStatus('ok')
        navigate('/app/media', { replace: true, state: { spotifyConnected: true } })
      } else {
        setMessage(result.error ?? 'Token exchange failed.')
        setStatus('error')
        const t = setTimeout(() => navigate('/app/media', { replace: true, state: { spotifyError: true } }), 3000)
        return () => clearTimeout(t)
      }
    })
    return () => { cancelled = true }
  }, [searchParams, navigate])

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {status === 'pending' && <p className="text-slate-600 dark:text-slate-400">Connecting to Spotify…</p>}
      {status === 'ok' && <p className="text-green-600 dark:text-green-400">Connected. Redirecting…</p>}
      {status === 'error' && (
        <>
          <p className="text-red-600 dark:text-red-400" role="alert">{message}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">Redirecting to Media.</p>
        </>
      )}
    </div>
  )
}
