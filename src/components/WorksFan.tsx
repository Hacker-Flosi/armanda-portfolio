'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { navigateWithFanTransition } from '@/lib/viewTransition'

export type FanWork = { id: string; src: string; alt: string }

// Wie weit man am unteren Rand noch weiterziehen muss, bis der Fächer ganz
// gespannt ist und man zu den Werken geht.
const DRAG_THRESHOLD = 110

export function WorksFan({ works }: { works: FanWork[] }) {
  const router = useRouter()
  const [atBottom, setAtBottom] = useState(false)
  const [progress, setProgress] = useState(0)
  const [tensioned, setTensioned] = useState(false)

  const atBottomRef = useRef(false)
  const dragStartY = useRef<number | null>(null)
  const navigatingRef = useRef(false)

  useEffect(() => {
    function checkAtBottom() {
      const bottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      atBottomRef.current = bottom
      setAtBottom(bottom)
    }
    checkAtBottom()
    window.addEventListener('scroll', checkAtBottom, { passive: true })
    window.addEventListener('resize', checkAtBottom)

    function onTouchStart(e: TouchEvent) {
      // Nur scharf, wenn die Geste bereits am unteren Rand STARTET — ein
      // normaler Scroll bis ganz nach unten löst dadurch nie versehentlich aus.
      if (!atBottomRef.current) return
      dragStartY.current = e.touches[0].clientY
    }

    function onTouchMove(e: TouchEvent) {
      if (dragStartY.current === null) return
      if (!atBottomRef.current) {
        dragStartY.current = null
        setProgress(0)
        return
      }
      const dy = dragStartY.current - e.touches[0].clientY
      const p = Math.max(0, Math.min(1, dy / DRAG_THRESHOLD))
      setProgress(p)
      if (p >= 1 && !navigatingRef.current) {
        navigatingRef.current = true
        setTensioned(true)
        navigateWithFanTransition(router, '/')
      }
    }

    function onTouchEnd() {
      dragStartY.current = null
      if (!navigatingRef.current) setProgress(0)
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('scroll', checkAtBottom)
      window.removeEventListener('resize', checkAtBottom)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [router])

  if (works.length === 0) return null

  const center = (works.length - 1) / 2

  return (
    <div
      aria-hidden
      className="sm:hidden fixed inset-x-0 bottom-9 z-10 flex justify-center pointer-events-none"
      style={{ height: 1 }}
    >
      <div
        className={tensioned ? 'fan-tension' : undefined}
        style={{ position: 'relative', width: 0, height: 0 }}
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
                transition: dragStartY.current ? 'none' : 'transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.35s ease',
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
