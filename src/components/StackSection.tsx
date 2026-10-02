'use client'

import { useEffect, useRef } from 'react'
import type { MouseEvent, ReactNode } from 'react'

export const STRIP_PX = 36
const HEADER_PX = 36
const MAX_DIM = 0.62

// Abschnitt in Viewport-Höhe, der unter dem Header kleben bleibt. Jeder
// weitere Abschnitt bleibt STRIP_PX tiefer hängen, sodass sich die Köpfe der
// bereits passierten Projekte oben aneinanderreihen, bis der Bereich endet.
// Ein Klick auf einen verdeckten Kopf scrollt zurück zum Anker des Projekts
// (ein Klick auf das Plus dort scrollt ebenfalls und klappt die Infos auf).
// Alle StackSections müssen im selben Elternelement stehen.
export function StackSection({
  children,
  index,
  className,
}: {
  children: ReactNode
  index: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  // Je weiter der nächste Abschnitt darüberrutscht, desto dunkler wird dieser.
  useEffect(() => {
    const outer = ref.current
    const inner = innerRef.current
    if (!outer || !inner) return
    let frame = 0
    function update() {
      frame = 0
      const next = outer!.nextElementSibling as HTMLElement | null
      if (!next || !inner) return
      const height = outer!.offsetHeight
      const gap = next.getBoundingClientRect().top - outer!.getBoundingClientRect().top
      const progress = Math.min(1, Math.max(0, 1 - (gap - STRIP_PX) / (height - STRIP_PX)))
      inner.style.opacity = String(1 - MAX_DIM * progress)
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
  }, [])

  function onClickCapture(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const next = el.nextElementSibling as HTMLElement | null
    if (!next) return
    const rect = el.getBoundingClientRect()
    const covered = next.getBoundingClientRect().top < rect.top + el.offsetHeight - 4
    if (!covered || e.clientY - rect.top > STRIP_PX) return
    // Buttons im Kopf (z.B. das Plus) sollen ihre Aktion trotzdem ausführen:
    // das Projekt wird also geöffnet und das Plus klappt dort die Infos auf.
    if (!(e.target as HTMLElement).closest('button')) {
      e.preventDefault()
      e.stopPropagation()
    }

    let natural = el.parentElement!.getBoundingClientRect().top + window.scrollY
    for (let sibling = el.parentElement!.firstElementChild; sibling && sibling !== el; sibling = sibling.nextElementSibling) {
      natural += (sibling as HTMLElement).offsetHeight
    }
    const stickyTop = HEADER_PX + index * STRIP_PX
    window.scrollTo({ top: natural - stickyTop, behavior: 'smooth' })
  }

  return (
    <div
      ref={ref}
      onClickCapture={onClickCapture}
      className={`sticky overflow-hidden bg-[var(--bg)] hover:[&>div]:!opacity-100 ${className ?? ''}`}
      style={{
        top: HEADER_PX + index * STRIP_PX,
        height: `calc(100svh - ${HEADER_PX * 2 + index * STRIP_PX}px)`,
      }}
    >
      <div ref={innerRef} className="flex flex-col h-full sm:transition-opacity sm:duration-300">
        {children}
      </div>
    </div>
  )
}
