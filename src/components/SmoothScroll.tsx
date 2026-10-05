'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

// Weiches Mausrad-Scrollen mit sanftem Nachlaufen (nur Desktop mit Maus; auf
// Touchgeräten und bei "Bewegung reduzieren" bleibt das native Scrollen).
// Overlays (Archiv, Lightbox, Dialoge) tragen data-lenis-prevent und
// scrollen dadurch nativ; die Seite dahinter ist per body-overflow gesperrt.
export function SmoothScroll() {
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    if (!mq.matches) return

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true })
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    })

    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
    }
  }, [])

  return null
}
