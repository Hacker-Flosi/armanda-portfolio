'use client'

import { useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import Image from 'next/image'
import { LazyVideo } from '@/components/LazyVideo'

export type CarouselItem = { key: string; kind: 'image' | 'video'; src: string; aspectRatio?: number | null; caption?: string }

const DURATION_MS = 4500
const LEAVE_MS = 180

// Breite Formate (Querformat/Quadrat, Videos) werden komplett gezeigt statt
// angeschnitten; Hochformate füllen die Fläche.
function Media({ item, alt }: { item: CarouselItem; alt: string }) {
  const ratio = item.kind === 'video' ? 16 / 9 : (item.aspectRatio ?? 1)
  const fit = ratio > 0.9 ? 'object-contain' : 'object-cover'
  return item.kind === 'video' ? (
    <LazyVideo src={item.src} className={`absolute inset-0 w-full h-full ${fit}`} />
  ) : (
    <Image src={item.src} alt={alt} fill sizes="100vw" draggable={false} className={fit} />
  )
}

// Mobiler Auto-Wechsel für Projekt-Medien wie im Kunst-Portfolio: ein Medium
// im Vollbild, oben ein segmentierter Fortschrittsbalken, der zeigt, wie lange
// das aktuelle noch läuft. Wechsel mit Reveal-Animation (ohne Überlagerung), Wischen oder Tippen: ein
// Tippen aufs Bild zeigt das nächste (linkes Drittel: das vorherige), ein
// Tippen auf ein Segment springt dorthin; die Detailansicht öffnet der kleine
// Vergrössern-Knopf unten rechts.
export function MobileProjectCarousel({
  items,
  label,
  onOpen,
}: {
  items: CarouselItem[]
  label: string
  onOpen: (index: number) => void
}) {
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const [inView, setInView] = useState(false)
  const [reduced, setReduced] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const count = items.length

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.4 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Kein Überblenden: das aktuelle Medium blendet kurz aus, dann baut sich das
  // nächste mit der gleichen Reveal-Bewegung wie der Rest der Seite auf.
  function go(next: number) {
    const target = (next + count) % count
    if (target === index || leaving) return
    setLeaving(true)
    window.setTimeout(() => {
      setIndex(target)
      setLeaving(false)
    }, reduced ? 0 : LEAVE_MS)
  }

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  function onTouchEnd(e: TouchEvent) {
    const start = touchStart.current
    touchStart.current = null
    if (!start) return
    const t = e.changedTouches[0]
    const dx = t.clientX - start.x
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(t.clientY - start.y)) go(index + (dx < 0 ? 1 : -1))
  }

  if (count === 0) return null
  const current = items[index]
  const playing = inView && !reduced && count > 1

  return (
    <div
      ref={rootRef}
      className="relative w-full h-full overflow-hidden bg-[var(--bg)]"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="absolute inset-0"
        style={{ opacity: leaving ? 0 : 1, transition: `opacity ${LEAVE_MS}ms ease-in` }}
      >
        <div key={index} className="absolute inset-0 carousel-reveal">
          <Media item={current} alt={label} />
        </div>
      </div>

      <button
        type="button"
        aria-label={`${label} — nächstes Medium`}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          const leftThird = e.clientX - rect.left < rect.width / 3
          go(index + (leftThird ? -1 : 1))
        }}
        className="absolute inset-0 z-[1]"
      />
      <button
        type="button"
        aria-label={`${label} — Medium ${index + 1} vergrössern`}
        onClick={() => onOpen(index)}
        className="absolute right-3 top-8 z-[3] w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
          <path d="M9.5 2H14v4.5M6.5 14H2V9.5M14 2L9 7M2 14l5-5" />
        </svg>
      </button>

      {count > 1 && (
        <div className="absolute top-0 inset-x-0 z-[2] h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
      )}

      {count > 1 && (
        <div className="absolute top-2 inset-x-3 z-[2] flex gap-1">
          {items.map((item, i) => (
            <button
              key={item.key}
              type="button"
              aria-label={`Medium ${i + 1} von ${count}`}
              onClick={() => go(i)}
              className="flex-1 h-5 flex items-start"
            >
              <span className="relative block w-full h-[3px] rounded-full bg-white/30 overflow-hidden">
                <span
                  key={i === index ? `active-${index}` : `idle-${i}`}
                  className={`absolute inset-y-0 left-0 bg-white ${i === index && !reduced ? 'carousel-fill' : ''}`}
                  style={{
                    width: i < index || (i === index && reduced) ? '100%' : i === index ? undefined : '0%',
                    animationDuration: `${DURATION_MS}ms`,
                    animationPlayState: playing ? 'running' : 'paused',
                  }}
                  onAnimationEnd={() => {
                    if (i === index) go(index + 1)
                  }}
                />
              </span>
            </button>
          ))}
        </div>
      )}

      {current.caption && <span className="absolute left-3 bottom-3 z-[2] text-xs text-white h-6 px-2.5 inline-flex items-center rounded-full bg-black/45 backdrop-blur">{current.caption}</span>}
    </div>
  )
}
