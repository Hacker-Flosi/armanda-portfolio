'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

// Weiches Mausrad-Scrollen mit sanftem Nachlaufen (nur Desktop mit Maus; auf
// Touchgeräten und bei "Bewegung reduzieren" bleibt das native Scrollen).
// Sobald ein Overlay den Seitenscroll sperrt (body overflow: hidden, z.B.
// Lightbox), pausiert das weiche Scrollen mit.
export function SmoothScroll() {
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)')
    if (!mq.matches) return

    const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true })
    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    })

    const syncLock = () => {
      if (document.body.style.overflow === 'hidden') lenis.stop()
      else lenis.start()
    }
    const observer = new MutationObserver(syncLock)
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] })
    syncLock()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      lenis.destroy()
    }
  }, [])

  return null
}
