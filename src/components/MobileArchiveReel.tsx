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
    let frame = 0
    function update() {
      frame = 0
      const container = containerRef.current
      const stage = stageRef.current
      if (!container || !stage) return
      const scrollable = container.offsetHeight - stage.offsetHeight
      const progress = Math.min(1, Math.max(0, (HEADER_PX - container.getBoundingClientRect().top) / scrollable))
      const pos = progress * (cardCount - 1)

      cardRefs.current.forEach((card, i) => {
        if (!card) return
        const delta = i - pos
        if (delta > 0) {
          const t = Math.min(1, delta)
          card.style.transform = `translateY(${t * 108}%) scale(${1 - Math.min(1, delta) * 0.04})`
          card.style.opacity = delta > 1.05 ? '0' : '1'
          card.style.filter = 'none'
        } else {
          const back = Math.min(1, -delta)
          card.style.transform = `translateY(${-back * 5}%) scale(${1 - back * 0.08})`
          card.style.opacity = String(1 - back * 0.75)
          card.style.filter = `blur(${back * 4}px)`
        }
      })

      const current = Math.min(cardCount - 1, Math.round(pos))
      if (counterRef.current) counterRef.current.textContent = current < tiles.length ? `${current + 1} / ${total}` : 'Archiv'
      if (barRef.current) barRef.current.style.transform = `scaleX(${progress})`
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [cardCount, tiles.length, total])

  return (
    <div
      ref={containerRef}
      className="sm:hidden relative"
      style={{ height: `calc(100dvh - ${HEADER_PX * 2}px + ${(cardCount - 1) * SCROLL_PER_CARD}vh)` }}
    >
      <div
        ref={stageRef}
        className="sticky overflow-hidden px-3 pb-3 pt-1"
        style={{ top: HEADER_PX, height: `calc(100dvh - ${HEADER_PX * 2}px)` }}
      >
        <div className="relative w-full h-full">
          {tiles.map((tile, i) => (
            <div
              key={tile.key}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              className="absolute inset-0 overflow-hidden rounded-[22px] bg-[#161616] will-change-transform"
              style={{ zIndex: i, transform: 'translateY(108%)' }}
            >
              {tile.kind === 'video' ? (
                <LazyVideo src={tile.src} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <Image src={tile.src} alt={tile.label} fill sizes="100vw" draggable={false} className="object-cover" />
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute left-4 bottom-4 text-sm text-white">{tile.label}</span>
            </div>
          ))}

          <div
            ref={(el) => {
              cardRefs.current[tiles.length] = el
            }}
            className="absolute inset-0 overflow-hidden rounded-[22px] bg-[var(--ink)] text-[var(--bg)] will-change-transform"
            style={{ zIndex: tiles.length, transform: 'translateY(108%)' }}
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
          </div>

          <div className="absolute left-4 top-4 z-[50] flex items-center gap-3 pointer-events-none">
            <span ref={counterRef} className="h-7 px-3 inline-flex items-center rounded-full bg-black/55 text-white text-xs backdrop-blur">
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
