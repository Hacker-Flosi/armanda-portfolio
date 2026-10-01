'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { navigateWithFanTransition } from '@/lib/viewTransition'

export type FanWork = { id: string; src: string; alt: string }

// Wie weit man nach dem vollen Aufgefächert-sein noch weiterziehen muss,
// bis es zu den Werken geht.
const CONFIRM_THRESHOLD = 55

export function WorksFan({ works }: { works: FanWork[] }) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [tensioned, setTensioned] = useState(false)

  const atFullRef = useRef(false)
  const dragStartY = useRef<number | null>(null)
  const navigatingRef = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Der Fächer öffnet sich mit dem normalen Scrollen: sobald die Box von
    // unten in den Viewport wandert, geht er proportional dazu auf — er
    // erscheint also erst am Ende der Seite, kein fixiertes Overlay.
    function updateScrollProgress() {
      const rect = el!.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const p = Math.max(0, Math.min(1, (vh - rect.top) / rect.height))
      atFullRef.current = p >= 1
      setProgress(p)
    }

    updateScrollProgress()
    window.addEventListener('scroll', updateScrollProgress, { passive: true })
    window.addEventListener('resize', updateScrollProgress)

    function onTouchStart(e: TouchEvent) {
      // Nur scharf, wenn der Fächer bereits voll offen ist (= man ist am
      // Ende der Seite angekommen) — das normale Scrollen dorthin öffnet
      // ihn nur, löst aber nie von selbst die Navigation aus.
      if (!atFullRef.current) return
      dragStartY.current = e.touches[0].clientY
    }

    function onTouchMove(e: TouchEvent) {
      if (dragStartY.current === null) return
      if (!atFullRef.current) {
        dragStartY.current = null
        setTensioned(false)
        return
      }
      const dy = dragStartY.current - e.touches[0].clientY
      const confirm = Math.max(0, Math.min(1, dy / CONFIRM_THRESHOLD))
      setTensioned(confirm > 0.15)
      if (confirm >= 1 && !navigatingRef.current) {
        navigatingRef.current = true
        navigateWithFanTransition(router, '/')
      }
    }

    function onTouchEnd() {
      dragStartY.current = null
      if (!navigatingRef.current) setTensioned(false)
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('scroll', updateScrollProgress)
      window.removeEventListener('resize', updateScrollProgress)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [router])

  if (works.length === 0) return null

  const center = (works.length - 1) / 2

  return (
    <div ref={containerRef} aria-hidden className="sm:hidden relative h-72 w-full pointer-events-none">
      <div
        className={tensioned ? 'fan-tension' : undefined}
        style={{ position: 'absolute', left: '50%', bottom: 0, width: 0, height: 0 }}
      >
        {works.map((work, i) => {
          const offset = i - center
          const angle = offset * 14 * progress
          const lift = 46 + progress * 120
          const scale = 0.82 + 0.18 * progress
          const closedOpacity = 0.55 + 0.1 * Math.max(0, 1 - Math.abs(offset) * 0.3)
          const opacity = closedOpacity + (1 - closedOpacity) * progress

          return (
            <div
              key={work.id}
              className="absolute left-1/2 bottom-0 w-16 aspect-[3/4] rounded-md overflow-hidden shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
              style={{
                viewTransitionName: `fan-work-${work.id}`,
                transform: `translateX(-50%) translateX(${offset * 3}px) rotate(${angle}deg) translateY(${-lift}px) scale(${scale})`,
                opacity,
              }}
            >
              <Image src={work.src} alt={work.alt} fill sizes="64px" className="object-cover" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
