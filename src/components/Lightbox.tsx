'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

type LightboxItem = { fullSrc: string; alt: string }

const LightboxContext = createContext<{ open: (index: number) => void } | null>(null)

export function useLightbox() {
  const ctx = useContext(LightboxContext)
  if (!ctx) throw new Error('useLightbox must be used inside a LightboxProvider')
  return ctx
}

function ChevronIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === 'left' ? <path d="M15 5 7 12l8 7" /> : <path d="M9 5l8 7-8 7" />}
    </svg>
  )
}

export function LightboxProvider({ items, children }: { items: LightboxItem[]; children: ReactNode }) {
  const [index, setIndex] = useState<number | null>(null)

  const close = useCallback(() => setIndex(null), [])
  const prev = useCallback(
    () => setIndex((i) => (i === null ? null : (i - 1 + items.length) % items.length)),
    [items.length]
  )
  const next = useCallback(
    () => setIndex((i) => (i === null ? null : (i + 1) % items.length)),
    [items.length]
  )
  const open = useCallback((i: number) => setIndex(i), [])

  useEffect(() => {
    if (index === null) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [index, close, prev, next])

  const current = index !== null ? items[index] : null

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}
      {current
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              onClick={close}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10"
              style={{
                background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
                backdropFilter: 'blur(32px)',
              }}
            >
              <button
                type="button"
                onClick={close}
                aria-label="Schliessen"
                className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center text-2xl text-[var(--ink)] cursor-pointer"
              >
                ×
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  prev()
                }}
                aria-label="Vorheriges Bild"
                className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center text-[var(--ink)] cursor-pointer"
              >
                <ChevronIcon direction="left" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  next()
                }}
                aria-label="Nächstes Bild"
                className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 w-11 h-11 flex items-center justify-center text-[var(--ink)] cursor-pointer"
              >
                <ChevronIcon direction="right" />
              </button>
              <div className="relative z-0 w-full h-full" onClick={(e) => e.stopPropagation()}>
                <Image src={current.fullSrc} alt={current.alt} fill sizes="100vw" className="object-contain" />
              </div>
            </div>,
            document.body
          )
        : null}
    </LightboxContext.Provider>
  )
}

export function LightboxTrigger({
  index,
  src,
  alt,
  sizes,
  className,
}: {
  index: number
  src: string
  alt: string
  sizes: string
  className: string
}) {
  const { open } = useLightbox()
  return (
    <button
      type="button"
      onClick={() => open(index)}
      aria-label={`${alt} — Bild vergrössern`}
      className="absolute inset-0 w-full h-full cursor-zoom-in"
    >
      <Image src={src} alt={alt} fill sizes={sizes} className={className} />
    </button>
  )
}
