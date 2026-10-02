'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import type { MediaTile } from '@/lib/designMedia'
import { LazyVideo } from '@/components/LazyVideo'

const SCROLL_PER_CARD = 62 // vh pro Karte
const HEADER_PX = 36

// Mobile Einstimmung aufs Archiv: eine klebende Bühne, auf der beim Scrollen
// Karte für Karte von unten heraufgleitet (die vorherige rückt zurück und
// dunkelt ab). Die letzte Karte ist der Absprung ins ganze Archiv.
export function MobileArchiveReel({
  tiles,
  total,
  onOpen,
}: {
  tiles: MediaTile[]
  total: number
  onOpen: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const counterRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const cardCount = tiles.length + 1

  useEffect(() => {
    const container = containerRef.current
    const stage = stageRef.current
    if (!container || !stage) return
    const cards = cardRefs.current
    const veils = cards.map((card) => card?.querySelector<HTMLElement>('[data-veil]') ?? null)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let scrollable = 1
    let target = 0 // Zielposition aus dem Scroll (0 … cardCount-1)
    let current = -1 // aktuell dargestellte Position (wird weich nachgezogen)
    let frame = 0
    let lastLabel = ''

    function measure() {
      scrollable = Math.max(1, container!.offsetHeight - stage!.offsetHeight)
    }
    function readTarget() {
      const progress = Math.min(1, Math.max(0, (HEADER_PX - container!.getBoundingClientRect().top) / scrollable))
      target = progress * (cardCount - 1)
    }

    function render(pos: number) {
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i]
        if (!card) continue
        const delta = i - pos
        // Weit entfernte Karten ganz aus dem Compositing nehmen.
        if (delta > 1.02 || delta < -1.3) {
          if (card.style.visibility !== 'hidden') card.style.visibility = 'hidden'
          continue
        }
        if (card.style.visibility !== 'visible') card.style.visibility = 'visible'
        const veil = veils[i]
        if (delta > 0) {
          card.style.transform = `translate3d(0, ${delta * 108}%, 0) scale(${1 - delta * 0.04})`
          if (veil) veil.style.opacity = '0'
        } else {
          const back = Math.min(1, -delta)
          card.style.transform = `translate3d(0, 0, 0) scale(${1 - back * 0.06})`
          // Vorherige Karten bleiben deckend; ein Schleier in der Seitenfarbe
          // (im hellen Modus heller, im dunklen dunkler) nimmt ihnen den Fokus.
          if (veil) veil.style.opacity = (back * 0.6).toFixed(3)
        }
      }
      const index = Math.min(cardCount - 1, Math.round(pos))
      const label = index < tiles.length ? `${index + 1} / ${total}` : 'Archiv'
      if (label !== lastLabel && counterRef.current) {
        counterRef.current.textContent = label
        lastLabel = label
      }
      if (barRef.current) barRef.current.style.transform = `scaleX(${pos / (cardCount - 1)})`
    }

    // Die Darstellung folgt der Scroll-Position mit leichter Dämpfung. Das
    // glättet unregelmässige Scroll-Events auf Mobilgeräten und lässt die
    // Karten gleiten statt zu springen.
    function tick() {
      frame = 0
      readTarget()
      if (current < 0 || reduced) current = target
      else current += (target - current) * 0.2
      if (Math.abs(target - current) < 0.0008) current = target
      render(current)
      if (current !== target) frame = requestAnimationFrame(tick)
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(tick)
    }

    measure()
    const observer = new ResizeObserver(() => {
      measure()
      schedule()
    })
    observer.observe(container)
    observer.observe(stage)
    tick()
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [cardCount, tiles.length, total])

  return (
    <div
      ref={containerRef}
      className="sm:hidden relative"
      style={{ height: `calc(100svh - ${HEADER_PX * 2}px + ${(cardCount - 1) * SCROLL_PER_CARD}vh)` }}
    >
      <div
        ref={stageRef}
        className="sticky overflow-hidden px-3 pb-3 pt-3"
        style={{ top: HEADER_PX, height: `calc(100svh - ${HEADER_PX * 2}px)` }}
      >
        <div className="relative w-full h-full">
          {tiles.map((tile, i) => (
            <div
              key={tile.key}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              className="absolute inset-0 overflow-hidden rounded-md bg-[var(--bg)] will-change-transform"
              style={{ zIndex: i, transform: 'translate3d(0, 108%, 0)', visibility: 'hidden' }}
            >
              {tile.kind === 'video' ? (
                <LazyVideo src={tile.src} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <Image src={tile.src} alt={tile.label} fill sizes="100vw" draggable={false} className="object-cover" />
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute left-4 bottom-4 text-sm text-white">{tile.label}</span>
              <div data-veil className="absolute inset-0 bg-[var(--bg)] pointer-events-none" style={{ opacity: 0 }} />
            </div>
          ))}

          <div
            ref={(el) => {
              cardRefs.current[tiles.length] = el
            }}
            className="absolute inset-0 overflow-hidden rounded-md bg-[var(--ink)] text-[var(--bg)] will-change-transform"
            style={{ zIndex: tiles.length, transform: 'translate3d(0, 108%, 0)', visibility: 'hidden' }}
          >
            <button type="button" onClick={onOpen} className="absolute inset-0 flex flex-col justify-between p-6 text-left">
              <span className="text-sm opacity-60">Spielwiese</span>
              <span className="font-medium" style={{ fontSize: 'clamp(2.25rem, 12vw, 3.5rem)', lineHeight: 0.95, letterSpacing: '-0.04em' }}>
                Das ganze
                <br />
                Archiv
                <br />
                ansehen
              </span>
              <span className="flex items-center justify-between">
                <span className="text-sm opacity-70">{total} Arbeiten</span>
                <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--bg)] text-[var(--ink)] text-xl">→</span>
              </span>
            </button>
            <div data-veil className="absolute inset-0 bg-[var(--bg)] pointer-events-none" style={{ opacity: 0 }} />
          </div>

          <div className="absolute left-4 top-4 z-[50] flex items-center gap-3 pointer-events-none">
            <span ref={counterRef} className="h-7 px-3 inline-flex items-center rounded-full bg-black/65 text-white text-xs">
              1 / {total}
            </span>
          </div>
          <div className="absolute inset-x-4 bottom-0 z-[50] h-[3px] rounded-full bg-white/20 overflow-hidden pointer-events-none translate-y-[-6px]">
            <span ref={barRef} className="block h-full origin-left bg-white" style={{ transform: 'scaleX(0)' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
