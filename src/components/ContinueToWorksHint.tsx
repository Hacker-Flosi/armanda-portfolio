'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

// Wie weit man am unteren Rand noch weiterziehen muss, bis es zu den Werken geht.
const DRAG_THRESHOLD = 70

export function ContinueToWorksHint() {
  const router = useRouter()
  const [atBottom, setAtBottom] = useState(false)
  const [progress, setProgress] = useState(0)

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
      // Nur scharf, wenn die Geste am unteren Rand STARTET — ein normaler Scroll
      // bis ganz nach unten löst dadurch nie versehentlich aus.
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
        router.push('/')
      }
    }

    function onTouchEnd() {
      dragStartY.current = null
      setProgress(0)
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

  return (
    <div
      aria-hidden
      className="sm:hidden fixed inset-x-0 bottom-9 z-10 flex justify-center pb-2 pointer-events-none transition-opacity duration-300"
      style={{ opacity: atBottom ? Math.max(0.6, progress) : 0 }}
    >
      <div
        className="flex items-center gap-1.5 bg-[var(--bar-bg)] text-[var(--bar-fg)] text-xs px-3 py-1.5 rounded-full"
        style={{ transform: `translateY(${-progress * 3}px)` }}
      >
        <span>Weiter zu den Werken</span>
        <svg
          className="hint-bounce"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 9l7 7 7-7" />
        </svg>
      </div>
    </div>
  )
}
