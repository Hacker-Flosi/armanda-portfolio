'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

export function ParallaxReveal({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  const revealRef = useRef<HTMLDivElement>(null)
  const parallaxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const revealEl = revealRef.current
    const parallaxEl = parallaxRef.current
    if (!revealEl || !parallaxEl) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const revealObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          revealEl.classList.add('is-revealed')
          revealObserver.unobserve(revealEl)
        }
      },
      { threshold: 0.15 }
    )
    revealObserver.observe(revealEl)

    if (reduceMotion) {
      return () => revealObserver.disconnect()
    }

    let rafId = 0
    let active = false

    function tick() {
      const rect = revealEl!.getBoundingClientRect()
      const vh = window.innerHeight || 1
      const center = rect.top + rect.height / 2 - vh / 2
      const progress = center / (vh / 2 + rect.height / 2)
      const clamped = Math.max(-1, Math.min(1, progress))
      parallaxEl!.style.transform = `translate3d(0, ${(clamped * -48).toFixed(1)}px, 0)`
      if (active) rafId = requestAnimationFrame(tick)
    }

    const parallaxObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !active) {
          active = true
          rafId = requestAnimationFrame(tick)
        } else if (!entry.isIntersecting && active) {
          active = false
          cancelAnimationFrame(rafId)
        }
      },
      { rootMargin: '30% 0px 30% 0px' }
    )
    parallaxObserver.observe(revealEl)

    return () => {
      revealObserver.disconnect()
      parallaxObserver.disconnect()
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div ref={revealRef} className={`reveal ${className ?? ''}`} style={style}>
      <div ref={parallaxRef} className="absolute inset-0">
        {children}
      </div>
    </div>
  )
}
