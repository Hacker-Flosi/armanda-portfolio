'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

const WINDOWS = ['Vormittags', 'Nachmittags', 'Abends', 'Egal, wann es passt']

type Props = {
  kind: 'projekt' | 'rueckruf'
  summary?: Record<string, string>
  estimate?: string
  mailFallback?: string
}

// Formular für Projektanfrage (E-Mail) oder Rückrufwunsch (Telefon + Zeitfenster).
// Schickt die Angaben an /api/illustration-request.
export function InquiryForm({ kind, summary, estimate, mailFallback }: Props) {
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setState('sending')
    setError('')
    try {
      const res = await fetch('/api/illustration-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          name: form.get('name'),
          email: form.get('email'),
          phone: form.get('phone'),
          window: form.get('window'),
          message: form.get('message'),
          website: form.get('website'),
          consent: form.get('consent') === 'on',
          summary,
          estimate,
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        setError(
          data.error === 'invalid-email'
            ? 'Bitte gib eine gültige E-Mail-Adresse an.'
            : data.error === 'invalid-phone'
              ? 'Bitte gib eine gültige Telefonnummer an.'
              : data.error === 'too-many-requests'
                ? 'Das waren viele Anfragen in kurzer Zeit. Versuche es bitte später nochmals.'
                : 'Das hat leider nicht geklappt.'
        )
        setState('error')
        return
      }
      setState('done')
    } catch {
      setError('Das hat leider nicht geklappt.')
      setState('error')
    }
  }

  if (state === 'done') {
    return (
      <div className="archive-tile border border-[var(--line)] p-6 flex flex-col gap-2" role="status">
        <span className="text-xl font-medium">Danke, deine Anfrage ist bei mir angekommen.</span>
        <span className="text-[var(--ink-muted)]">
          {kind === 'rueckruf' ? 'Ich melde mich telefonisch bei dir.' : 'Ich melde mich in den nächsten Tagen per E-Mail bei dir.'}
        </span>
      </div>
    )
  }

  const field = 'w-full h-12 px-4 bg-transparent border border-[var(--ink)]/30 focus:border-[var(--ink)] outline-none transition-colors'

  return (
    <form onSubmit={submit} className="archive-tile flex flex-col gap-4 max-w-xl">
      <label className="flex flex-col gap-1.5 text-sm">
        Dein Name
        <input name="name" required maxLength={100} autoComplete="name" className={field} />
      </label>
      {kind === 'projekt' ? (
        <label className="flex flex-col gap-1.5 text-sm">
          Deine E-Mail
          <input name="email" type="email" required maxLength={200} autoComplete="email" className={field} />
        </label>
      ) : (
        <>
          <label className="flex flex-col gap-1.5 text-sm">
            Deine Telefonnummer
            <input name="phone" type="tel" required maxLength={40} autoComplete="tel" className={field} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Wann erreiche ich dich am besten?
            <select name="window" className={field} defaultValue={WINDOWS[3]}>
              {WINDOWS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
      <label className="flex flex-col gap-1.5 text-sm">
        {kind === 'projekt' ? 'Erzähl mir kurz von deinem Projekt' : 'Worum geht es? (optional)'}
        <textarea name="message" rows={4} maxLength={2000} className="w-full px-4 py-3 bg-transparent border border-[var(--ink)]/30 focus:border-[var(--ink)] outline-none transition-colors" />
      </label>

      {/* Spam-Falle: für Menschen unsichtbar. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] w-px h-px opacity-0" />

      <label className="flex items-start gap-3 text-sm text-[var(--ink-muted)]">
        <input name="consent" type="checkbox" required className="mt-1 w-4 h-4 accent-[var(--ink)]" />
        <span>Ich bin einverstanden, dass meine Angaben zur Beantwortung meiner Anfrage verwendet werden.</span>
      </label>

      {state === 'error' && (
        <p className="text-sm" role="alert">
          {error}
          {mailFallback && (
            <>
              {' '}
              Schreib mir stattdessen direkt an{' '}
              <a href={`mailto:${mailFallback}`} className="underline underline-offset-4">
                {mailFallback}
              </a>
              .
            </>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'sending'}
        className="self-start h-12 px-7 rounded-full bg-[var(--ink)] text-[var(--bg)] font-medium cursor-pointer disabled:opacity-60"
      >
        {state === 'sending' ? 'Sende …' : kind === 'projekt' ? 'Anfrage an Armanda senden' : 'Rückruf anfordern'}
      </button>
    </form>
  )
}
