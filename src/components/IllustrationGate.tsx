'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { useRouter } from 'next/navigation'

// Passwortabfrage vor der Illustrations-Seite (Konzeptphase).
export function IllustrationGate() {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'sending' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const password = String(new FormData(e.currentTarget).get('password') ?? '')
    setState('sending')
    try {
      const res = await fetch('/api/illustration-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        router.refresh()
        return
      }
      setMessage(res.status === 429 ? 'Zu viele Versuche. Bitte warte kurz.' : 'Das Passwort stimmt nicht.')
      setState('error')
    } catch {
      setMessage('Das hat leider nicht geklappt.')
      setState('error')
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20 bg-[var(--bg)] text-[var(--ink)]">
      <form onSubmit={submit} className="w-full max-w-sm flex flex-col gap-5">
        <h1 className="font-medium" style={{ fontSize: 'clamp(1.8rem, 1rem + 2.4vw, 2.8rem)', letterSpacing: '-0.03em', lineHeight: 1.02 }}>
          Diese Seite ist noch in Arbeit.
        </h1>
        <p className="text-[var(--ink-muted)]">Mit dem Passwort kommst du hinein.</p>
        <label className="flex flex-col gap-1.5 text-sm">
          Passwort
          <input
            name="password"
            type="password"
            required
            autoFocus
            autoComplete="off"
            className="w-full h-12 px-4 bg-transparent border border-[var(--ink)]/30 focus:border-[var(--ink)] outline-none transition-colors"
          />
        </label>
        {state === 'error' && (
          <p className="text-sm" role="alert">
            {message}
          </p>
        )}
        <button
          type="submit"
          disabled={state === 'sending'}
          className="self-start h-12 px-7 rounded-full bg-[var(--ink)] font-medium cursor-pointer disabled:opacity-60"
          style={{ color: 'var(--bg)' }}
        >
          {state === 'sending' ? 'Prüfe …' : 'Öffnen'}
        </button>
      </form>
    </main>
  )
}
