'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const THRESHOLDS = Array.from({ length: 41 }, (_, i) => i / 40)
const DIM_OPACITY = 0.22
// Ab diesem sichtbaren Anteil beginnt das Aufhellen, ab FULL ist der Abschnitt hell.
const START = 0.12
const FULL = 0.5

// Dunkelt einen Abschnitt ab, solange er kaum im Viewport steht, und hellt ihn
// stufenlos auf, sobald er hineinscrollt (ab ca. der Hälfte voll hell). Bei
// Abschnitten, die höher als der Viewport sind, zählt der sichtbare Anteil
// der Viewport-Höhe.
export function FocusDim({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [opacity, setOpacity] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        const reference = Math.min(entry.boundingClientRect.height, window.innerHeight)
        const ratio = reference > 0 ? entry.intersectionRect.height / reference : 1
        const t = Math.min(1, Math.max(0, (ratio - START) / (FULL - START)))
        setOpacity(DIM_OPACITY + (1 - DIM_OPACITY) * t)
      },
      { threshold: THRESHOLDS }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{ opacity, transition: 'opacity 0.35s ease-out' }}
    >
      {children}
    </div>
  )
}
