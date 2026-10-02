'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'

export type DetailItem = {
  key: string
  title: string
  kind: 'image' | 'video'
  src: string
  fullSrc?: string
  year?: number | string
  note?: string
}

// Vollbild-Detailansicht einer Arbeit innerhalb einer Serie (Pfeile/Tasten
// wechseln innerhalb der Serie, Esc schliesst).
export function SeriesDetail({
  lane,
  items,
  startIndex,
  onClose,
}: {
  lane: string
  items: DetailItem[]
  startIndex: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const [closing, setClosing] = useState(false)
  const item = items[index]

  const close = useCallback(() => {
    setClosing(true)
    window.setTimeout(onClose, 300)
  }, [onClose])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % items.length)
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + items.length) % items.length)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [close, items.length])

  return createPortal(
    <div
      role="dialog"
      aria-modal
      aria-label={item.title}
      className={`fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]/95 text-[#f1f0eb] backdrop-blur ${closing ? 'archive-overlay-out' : 'archive-overlay-in'}`}
      onClick={close}
    >
      <div className="flex items-center justify-between px-4 h-12 shrink-0">
        <span className="text-sm text-[#8a8a85]">
          {lane} · {index + 1} / {items.length}
        </span>
        <button type="button" onClick={close} className="px-3 h-8 rounded-full border border-[#f1f0eb]/30 text-sm">
          Schliessen
        </button>
      </div>

      <div className="relative flex-1 min-h-0 px-4" onClick={(e) => e.stopPropagation()}>
        <div key={item.key} className="archive-tile absolute inset-x-4 inset-y-0">
          {item.kind === 'video' ? (
            <video src={item.src} className="w-full h-full object-contain" autoPlay muted loop playsInline controls />
          ) : (
            <Image src={item.fullSrc ?? item.src} alt={item.title} fill sizes="100vw" className="object-contain" />
          )}
        </div>
        {items.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Vorherige Arbeit"
              onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}
              className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0a0a0a]/70 border border-[#f1f0eb]/30"
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Nächste Arbeit"
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[#0a0a0a]/70 border border-[#f1f0eb]/30"
            >
              →
            </button>
          </>
        )}
      </div>

      <div className="px-4 py-4 shrink-0 flex flex-col gap-1 max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline gap-3">
          <span className="font-medium">{item.title}</span>
          {item.year && <span className="text-sm text-[#8a8a85]">{item.year}</span>}
        </div>
        {item.note && <p className="text-sm text-[#8a8a85]">{item.note}</p>}
      </div>
    </div>,
    document.body
  )
}
