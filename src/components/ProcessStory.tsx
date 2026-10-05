'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

export type ProcessStep = { key: string; title: string; text?: string; duration?: string; imageSrc?: string; videoSrc?: string }

const HEADER_PX = 36
const SCROLL_PER_STEP = 95 // vh Scrollweg pro Schritt

// Ablauf als Scrollytelling: eine klebende Bühne erzählt die Zusammenarbeit
// Schritt für Schritt. Links wechselt der Text (Nummer, Titel, Beschreibung,
// Dauer), rechts legen sich die Bilder von Armanda wie Drucke übereinander: der
// nächste gleitet leicht gedreht von unten herauf, der vorherige tritt zurück.
// Bilder oder Clips pro Schritt kommen aus dem Studio; bis dahin zeigt jede
// Karte einen ruhigen Platzhalter.
export function ProcessStory({ steps }: { steps: ProcessStep[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const textRefs = useRef<(HTMLDivElement | null)[]>([])
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const barRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [active, setActive] = useState(0)
  const count = steps.length

  useEffect(() => {
    const container = containerRef.current
    const stage = stageRef.current
    if (!container || !stage || count === 0) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let scrollable = 1
    let target = 0
    let current = 0
    let frame = 0
    let last = -1

    const measure = () => {
      scrollable = Math.max(1, container.offsetHeight - stage.offsetHeight)
    }
    const read = () => {
      const progress = Math.min(1, Math.max(0, (HEADER_PX - container.getBoundingClientRect().top) / scrollable))
      target = progress * (count - 1)
    }
    function render(pos: number) {
      for (let i = 0; i < count; i++) {
        const delta = i - pos
        const near = Math.abs(delta)

        const text = textRefs.current[i]
        if (text) {
          text.style.opacity = String(Math.max(0, 1 - near * 1.45))
          text.style.transform = `translate3d(0, ${(delta * 46).toFixed(1)}px, 0)`
          text.style.visibility = near > 0.69 ? 'hidden' : 'visible'
        }

        const card = cardRefs.current[i]
        if (card) {
          const dir = i % 2 === 0 ? -1 : 1
          if (delta > 1.02 || delta < -1.3) {
            card.style.visibility = 'hidden'
          } else {
            card.style.visibility = 'visible'
            const veil = card.querySelector<HTMLElement>('[data-veil]')
            if (delta > 0) {
              card.style.transform = `translate3d(0, ${(delta * 108).toFixed(2)}%, 0) rotate(${(dir * delta * 4).toFixed(2)}deg) scale(${(1 - delta * 0.03).toFixed(3)})`
              if (veil) veil.style.opacity = '0'
            } else {
              const back = Math.min(1, -delta)
              card.style.transform = `translate3d(0, ${(-back * 2).toFixed(2)}%, 0) rotate(${(dir * back * 1.6).toFixed(2)}deg) scale(${(1 - back * 0.05).toFixed(3)})`
              if (veil) veil.style.opacity = (back * 0.55).toFixed(3)
            }
          }
        }

        const bar = barRefs.current[i]
        if (bar) bar.style.transform = `scaleX(${Math.min(1, Math.max(0, pos - i + 1)).toFixed(3)})`
      }
      const index = Math.min(count - 1, Math.round(pos))
      if (index !== last) {
        last = index
        setActive(index)
      }
    }
    function tick() {
      frame = 0
      read()
      current = reduced ? target : current + (target - current) * 0.16
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
    if (!container || !stage || count < 2) return
    const top = container.getBoundingClientRect().top + window.scrollY
    const scrollable = container.offsetHeight - stage.offsetHeight
    window.scrollTo({ top: top - HEADER_PX + (scrollable * i) / (count - 1) + 1, behavior: 'smooth' })
  }

  if (count === 0) return null

  return (
    <div ref={containerRef} className="relative" style={{ height: `calc(100svh - ${HEADER_PX * 2}px + ${(count - 1) * SCROLL_PER_STEP}vh)` }}>
      <div
        ref={stageRef}
        className="sticky grid gap-4 sm:gap-12 sm:grid-cols-[5fr_7fr] grid-rows-[1.1fr_1fr] sm:grid-rows-1 py-3 sm:py-6"
        style={{ top: HEADER_PX, height: `calc(100svh - ${HEADER_PX * 2}px)` }}
      >
        {/* Bühne: Drucke */}
        <div className="relative min-h-0 order-first sm:order-last">
          {steps.map((step, i) => {
            const media = Boolean(step.imageSrc || step.videoSrc)
            return (
              <div
                key={step.key}
                ref={(el) => {
                  cardRefs.current[i] = el
                }}
                className="absolute inset-0 overflow-hidden rounded-md bg-[var(--bg)] border border-[var(--ink)]/20 shadow-[0_14px_40px_rgba(0,0,0,0.18)] will-change-transform"
                style={{ zIndex: i, visibility: i === 0 ? 'visible' : 'hidden' }}
              >
                {media ? (
                  step.videoSrc ? (
                    Math.abs(active - i) <= 1 ? (
                      <video src={step.videoSrc} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : null
                  ) : (
                    step.imageSrc && <Image src={step.imageSrc} alt={step.title} fill sizes="(min-width: 640px) 55vw, 100vw" draggable={false} className="object-cover" />
                  )
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <span aria-hidden className="font-medium leading-none text-[var(--ink)]/[0.07]" style={{ fontSize: 'clamp(8rem, 28vw, 22rem)', letterSpacing: '-0.06em' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm text-[var(--ink-muted)]">Illustration folgt</span>
                  </div>
                )}
                <div data-veil aria-hidden className="absolute inset-0 bg-[var(--bg)] pointer-events-none" style={{ opacity: 0 }} />
              </div>
            )
          })}
        </div>

        {/* Text */}
        <div className="relative min-h-0 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-sm text-[var(--ink-muted)]">
            <span className="tabular-nums">
              {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
            </span>
            <div className="flex flex-1 max-w-xs gap-1.5">
              {steps.map((step, i) => (
                <button key={step.key} type="button" aria-label={`Zu Schritt ${i + 1}: ${step.title}`} onClick={() => jumpTo(i)} className="flex-1 h-5 flex items-center cursor-pointer">
                  <span className="relative block w-full h-[3px] rounded-full bg-[var(--ink)]/15 overflow-hidden">
                    <span
                      ref={(el) => {
                        barRefs.current[i] = el
                      }}
                      className="absolute inset-0 origin-left bg-[var(--ink)]"
                      style={{ transform: 'scaleX(0)' }}
                    />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative flex-1 min-h-0">
            {steps.map((step, i) => (
              <div
                key={step.key}
                ref={(el) => {
                  textRefs.current[i] = el
                }}
                className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col gap-4 will-change-transform"
                style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? 'visible' : 'hidden' }}
              >
                <h3 className="font-medium" style={{ fontSize: 'clamp(2.2rem, 1rem + 4.2vw, 5rem)', letterSpacing: '-0.04em', lineHeight: 0.98 }}>
                  {step.title}
                </h3>
                {step.text && <p className="text-lg leading-snug max-w-md">{step.text}</p>}
                {step.duration && (
                  <span className="self-start inline-flex items-center h-8 px-4 rounded-full border border-[var(--ink)]/30 text-sm">{step.duration}</span>
                )}
                {i === count - 1 && (
                  <a href="#konfigurator" className="self-start mt-2 h-12 px-7 inline-flex items-center rounded-full border border-[var(--ink)] font-medium hover:bg-[var(--ink)] hover:!text-[var(--bg)] transition-colors duration-300">
                    Jetzt Projekt zusammenstellen
                  </a>
                )}
              </div>
            ))}
          </div>

          <span className="text-xs text-[var(--ink-muted)] h-4" aria-hidden />
        </div>
      </div>
    </div>
  )
}
