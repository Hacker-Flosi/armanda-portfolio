'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export type HandworkStage = { title: string; text?: string; src: string; filter?: string }

const HEADER_PX = 36
const SCROLL_PER_STAGE = 85 // vh Scrollweg pro Schritt

// Handwerk zum Durchscrollen: eine klebende Bühne zeigt dasselbe Motiv in
// seinen Entstehungsschritten (Skizze → Entwurf → Illustration). Beim Scrollen
// wischt jede Stufe von links über die vorherige, an der Wischkante läuft eine
// feine Linie mit. Die Schritte links sind anklickbar und springen dorthin.
export function HandworkScrubber({ stages }: { stages: HandworkStage[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const layerRefs = useRef<(HTMLDivElement | null)[]>([])
  const edgeRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const [active, setActive] = useState(0)
  const count = stages.length

  useEffect(() => {
    const container = containerRef.current
    const stage = stageRef.current
    if (!container || !stage || count < 2) return
    let scrollable = 1
    let target = 0
    let current = 0
    let frame = 0
    let last = 0

    const measure = () => {
      scrollable = Math.max(1, container.offsetHeight - stage.offsetHeight)
    }
    const read = () => {
      const progress = Math.min(1, Math.max(0, (HEADER_PX - container.getBoundingClientRect().top) / scrollable))
      target = progress * (count - 1)
    }
    function render(pos: number) {
      let edge: number | null = null
      layerRefs.current.forEach((layer, i) => {
        if (!layer || i === 0) return
        const reveal = Math.min(1, Math.max(0, pos - (i - 1)))
        layer.style.clipPath = `inset(0 ${(100 - reveal * 100).toFixed(2)}% 0 0)`
        if (reveal > 0.001 && reveal < 0.999) edge = reveal
      })
      const el = edgeRef.current
      if (el) {
        el.style.opacity = edge === null ? '0' : '1'
        if (edge !== null) el.style.left = `${(edge * 100).toFixed(2)}%`
      }
      if (barRef.current) barRef.current.style.transform = `scaleY(${pos / (count - 1)})`
      const index = Math.round(pos)
      if (index !== last) {
        last = index
        setActive(index)
      }
    }
    function tick() {
      frame = 0
      read()
      current += (target - current) * 0.18
      if (Math.abs(target - current) < 0.0006) current = target
      render(current)
      if (current !== target) frame = requestAnimationFrame(tick)
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }
    measure()
    read()
    current = target
    render(current)
    const observer = new ResizeObserver(() => {
      measure()
      schedule()
    })
    observer.observe(container)
    observer.observe(stage)
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      window.removeEventListener('scroll', schedule)
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [count])

  function jumpTo(i: number) {
    const container = containerRef.current
    const stage = stageRef.current
    if (!container || !stage) return
    const top = container.getBoundingClientRect().top + window.scrollY
    const scrollable = container.offsetHeight - stage.offsetHeight
    window.scrollTo({ top: top - HEADER_PX + (scrollable * i) / (count - 1) + 1, behavior: 'smooth' })
  }

  if (count === 0) return null

  return (
    <div ref={containerRef} className="relative" style={{ height: `calc(100svh - ${HEADER_PX * 2}px + ${(count - 1) * SCROLL_PER_STAGE}vh)` }}>
      <div
        ref={stageRef}
        className="sticky grid gap-4 sm:gap-10 sm:grid-cols-[minmax(220px,1fr)_2fr] grid-rows-[1fr_auto] sm:grid-rows-1 py-3 sm:py-6"
        style={{ top: HEADER_PX, height: `calc(100svh - ${HEADER_PX * 2}px)` }}
      >
        {/* Bühne */}
        <div className="relative order-first sm:order-last min-h-0 overflow-hidden bg-[var(--ink)]/[0.06]">
          {stages.map((s, i) => (
            <div
              key={i}
              ref={(el) => {
                layerRefs.current[i] = el
              }}
              className="absolute inset-0"
              style={{ zIndex: i, clipPath: i === 0 ? undefined : 'inset(0 100% 0 0)' }}
            >
              <Image
                src={s.src}
                alt={s.title}
                fill
                sizes="(min-width: 640px) 60vw, 100vw"
                draggable={false}
                className="object-cover"
                style={s.filter ? { filter: s.filter } : undefined}
              />
            </div>
          ))}
          {/* Wischkante */}
          <div ref={edgeRef} aria-hidden className="absolute top-0 bottom-0 z-[20] w-px bg-white/90 mix-blend-difference pointer-events-none" style={{ opacity: 0 }} />
          <span className="absolute left-3 top-3 z-[30] h-7 px-3 inline-flex items-center rounded-full bg-black/65 text-white text-xs pointer-events-none">
            {String(active + 1).padStart(2, '0')} · {stages[active]?.title}
          </span>
        </div>

        {/* Schritte */}
        <ol className="relative flex sm:flex-col sm:justify-center gap-2 sm:gap-6 sm:pl-6">
          <span aria-hidden className="hidden sm:block absolute left-0 top-[12%] bottom-[12%] w-px bg-[var(--ink)]/20">
            <span ref={barRef} className="block w-full h-full origin-top bg-[var(--ink)]" style={{ transform: 'scaleY(0)' }} />
          </span>
          {stages.map((s, i) => {
            const on = i === active
            return (
              <li key={i} className="flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  aria-current={on}
                  className="w-full text-left flex flex-col gap-1 cursor-pointer transition-opacity duration-500"
                  style={{ opacity: on ? 1 : 0.4 }}
                >
                  <span className="text-xs text-[var(--ink-muted)]">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-medium" style={{ fontSize: 'clamp(1.1rem, 0.8rem + 1.2vw, 2rem)', letterSpacing: '-0.02em' }}>
                    {s.title}
                  </span>
                  {s.text && (
                    <span className="hidden sm:block text-[var(--ink-muted)] max-w-xs transition-all duration-500" style={{ maxHeight: on ? 120 : 0, overflow: 'hidden' }}>
                      {s.text}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
