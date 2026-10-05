'use client'

import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { ContactLink } from '@/components/ContactLink'

const OPEN_EVENT = 'open-cv-gate'

function openGate() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

export function CvButton() {
  return (
    <button type="button" onClick={openGate} className="cursor-pointer">
      CV
    </button>
  )
}

export function CvContactLink({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <ContactLink onClick={openGate} label="Lebenslauf" hoverLabel="Mit Passwort öffnen" className={className} style={style} />
}

// Passwortabfrage für den CV-Download. Wird einmal pro Seite eingebunden und
// über ein Fenster-Event von beliebigen Buttons geöffnet.
export function CvGate() {
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'wrong' | 'blocked' | 'error'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onOpen = () => {
      setOpen(true)
      setClosing(false)
      setPassword('')
      setStatus('idle')
    }
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function close() {
    setClosing(true)
    window.setTimeout(() => setOpen(false), 300)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!password || status === 'loading') return
    setStatus('loading')
    try {
      const res = await fetch('/api/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.status === 401) return setStatus('wrong')
      if (res.status === 429) return setStatus('blocked')
      if (!res.ok) return setStatus('error')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'Armanda-Asani-CV.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      close()
    } catch {
      setStatus('error')
    }
  }

  if (!open) return null

  const message =
    status === 'wrong'
      ? 'Passwort stimmt nicht.'
      : status === 'blocked'
        ? 'Zu viele Versuche — probier es später nochmals.'
        : status === 'error'
          ? 'Das hat nicht geklappt — probier es später nochmals.'
          : null

  return createPortal(
    <div
      role="dialog"
      aria-modal
      data-lenis-prevent
      aria-label="Mein Lebenslauf — Passwort"
      onClick={close}
      className={`fixed inset-0 z-[110] flex items-center justify-center p-4 bg-[#0a0a0a]/90 backdrop-blur text-[#f1f0eb] ${closing ? 'archive-overlay-out' : 'archive-overlay-in'}`}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="archive-tile w-full max-w-md flex flex-col gap-5"
      >
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-medium" style={{ letterSpacing: '-0.02em' }}>
            Mein Lebenslauf
          </span>
          <span className="text-sm text-[#8a8a85]">Mein Lebenslauf ist passwortgeschützt. Das Passwort habe ich dir mitgeschickt — falls nicht, schreib mir kurz.</span>
        </div>
        <input
          ref={inputRef}
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (status !== 'loading') setStatus('idle')
          }}
          autoComplete="off"
          placeholder="Passwort"
          className="h-12 px-4 rounded-full bg-transparent border border-[#f1f0eb]/40 focus:border-[#f1f0eb] outline-none"
        />
        {message && <span className="text-sm text-[#e0705f]">{message}</span>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!password || status === 'loading'}
            className="h-12 px-6 rounded-full bg-[#f1f0eb] text-[#0a0a0a] font-medium disabled:opacity-40"
          >
            {status === 'loading' ? 'Prüfe …' : 'Herunterladen'}
          </button>
          <button type="button" onClick={close} className="h-12 px-6 rounded-full border border-[#f1f0eb]/40">
            Abbrechen
          </button>
        </div>
      </form>
    </div>,
    document.body
  )
}
