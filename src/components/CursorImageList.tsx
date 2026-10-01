'use client'

import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import Image from 'next/image'

export type CursorImageItem = {
  id: string
  title: string
  subtitle?: string
  src: string
  aspectRatio: number | null
}

// Liste mit Bild-Vorschau, die dem Cursor folgt — inspiriert von
// avecanni.studio. Auf Mobile gibt es keinen Cursor, dort werden die Bilder
// stattdessen einfach direkt unter dem Titel gezeigt.
export function CursorImageList({ items }: { items: CursorImageItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const active = items.find((item) => item.id === activeId) ?? null

  if (items.length === 0) return null

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setActiveId(null)}
    >
      <p className="hidden sm:block text-sm text-[var(--ink-muted)] mb-2 md:ml-[9rem]">Cursor über einen Titel bewegen</p>

      {/* Desktop: reine Titelliste, das Bild erscheint schwebend am Cursor */}
      <ul className="hidden sm:flex flex-col divide-y divide-[var(--line)]">
        {items.map((item) => (
          <li
            key={item.id}
            onMouseEnter={() => setActiveId(item.id)}
            className="flex items-baseline justify-between py-3"
          >
            <span className="text-xl font-medium">{item.title}</span>
            {item.subtitle && <span className="text-sm text-[var(--ink-muted)]">{item.subtitle}</span>}
          </li>
        ))}
      </ul>

      {/* Mobil: kein Cursor vorhanden, Bilder direkt unter dem Titel zeigen */}
      <ul className="sm:hidden flex flex-col gap-6">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-2">
            <div
              className="relative w-full overflow-hidden rounded-md"
              style={{ aspectRatio: item.aspectRatio ?? 1.3 }}
            >
              <Image src={item.src} alt={item.title} fill sizes="100vw" className="object-cover" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-medium">{item.title}</span>
              {item.subtitle && <span className="text-sm text-[var(--ink-muted)]">{item.subtitle}</span>}
            </div>
          </li>
        ))}
      </ul>

      {active && (
        <div
          aria-hidden
          className="hidden sm:block absolute z-10 pointer-events-none overflow-hidden rounded-md shadow-xl"
          style={{
            left: pos.x + 28,
            top: pos.y - 100,
            width: 220,
            aspectRatio: active.aspectRatio ?? 1.3,
            transition: 'left 0.15s ease-out, top 0.15s ease-out',
          }}
        >
          <Image key={active.id} src={active.src} alt={active.title} fill sizes="220px" className="object-cover" />
        </div>
      )}
    </div>
  )
}
