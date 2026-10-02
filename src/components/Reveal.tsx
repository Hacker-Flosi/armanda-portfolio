'use client'

import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'

// Blendet Inhalt ein, sobald er beim Scrollen in den Viewport kommt —
// gleicher .reveal/.is-revealed-Mechanismus wie ParallaxReveal, nur ohne den
// Parallax-Layer, für Textblöcke, die keine Bild-Parallaxe brauchen.
export function Reveal({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-revealed')
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`reveal ${className ?? ''}`} style={style}>
      {children}
    </div>
  )
}
