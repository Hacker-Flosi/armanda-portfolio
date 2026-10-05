'use client'

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import Image from 'next/image'
import { ArchiveOverlay } from '@/components/ArchiveOverlay'
import type { MediaTile } from '@/lib/designMedia'

export type Topic = { name: string; count: number; previews: string[]; tiles: MediaTile[] }

// Archiv zum Entdecken: grosse Themenzeilen. Auf dem Desktop folgt dem Cursor
// eine Bildvorschau, die durch die Bilder des Themas wechselt; ein Klick (oder
// Tipp) öffnet das Archiv gefiltert auf dieses Thema.
export function ThemeExplorer({ topics }: { topics: Topic[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const [hover, setHover] = useState<number | null>(null)
  const [frame, setFrame] = useState(0)
  const [open, setOpen] = useState<Topic | null>(null)

  useEffect(() => {
    let raf = 0
    function tick() {
      current.current.x += (target.current.x - current.current.x) * 0.16
      current.current.y += (target.current.y - current.current.y) * 0.16
      const el = cardRef.current
      if (el) el.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) translate(-50%, -50%)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Beim Überfahren wechselt die Vorschau durch die Bilder des Themas.
  useEffect(() => {
    if (hover === null) return
    const timer = window.setInterval(() => setFrame((f) => f + 1), 650)
    return () => window.clearInterval(timer)
  }, [hover])

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    target.current = { x: e.clientX - rect.left + 60, y: e.clientY - rect.top }
  }

  const active = hover !== null ? topics[hover] : null

  return (
    <div ref={wrapRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <ul className="flex flex-col">
        {topics.map((topic, i) => (
          <li key={topic.name} className="border-t border-[var(--line)] last:border-b">
            <button
              type="button"
              onClick={() => setOpen(topic)}
              onMouseEnter={() => {
                setHover(i)
                setFrame(0)
              }}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              className="group w-full flex items-center justify-between gap-6 py-5 sm:py-7 text-left cursor-pointer"
              style={{ opacity: hover !== null && hover !== i ? 0.35 : 1, transition: 'opacity 0.4s ease' }}
            >
              <span
                className="font-medium transition-transform duration-500 group-hover:translate-x-3"
                style={{ fontSize: 'clamp(1.8rem, 0.9rem + 4.4vw, 5rem)', letterSpacing: '-0.035em', lineHeight: 1 }}
              >
                {topic.name}
              </span>
              <span className="flex items-center gap-4 shrink-0">
                {/* Mobil: kleine Vorschau statt Cursor-Bild */}
                <span className="flex -space-x-3 sm:hidden" aria-hidden>
                  {topic.previews.slice(0, 3).map((src, k) => (
                    <span key={k} className="relative w-9 h-12 overflow-hidden border-2 border-[var(--bg)] bg-[var(--ink)]/[0.06]">
                      <Image src={src} alt="" fill sizes="40px" className="object-cover" />
                    </span>
                  ))}
                </span>
                <span className="text-sm text-[var(--ink-muted)]">{topic.count}</span>
                <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1">
                  ↗
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Bildvorschau am Cursor (nur mit Maus) */}
      <div
        ref={cardRef}
        aria-hidden
        className="hidden [@media(hover:hover)]:block absolute top-0 left-0 z-10 pointer-events-none w-[220px] aspect-[3/4] overflow-hidden bg-[var(--ink)]/[0.08] transition-opacity duration-300"
        style={{ opacity: active ? 1 : 0 }}
      >
        {active?.previews.map((src, k) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="220px"
            className="object-cover transition-opacity duration-500"
            style={{ opacity: k === frame % active.previews.length ? 1 : 0 }}
          />
        ))}
      </div>

      {open && <ArchiveOverlay tiles={open.tiles} onClose={() => setOpen(null)} />}
    </div>
  )
}
