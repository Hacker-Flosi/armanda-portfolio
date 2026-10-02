'use client'

import { useEffect, useRef, useState } from 'react'

// Video, das erst nahe dem Viewport geladen wird und ausserhalb pausiert —
// spart Bandbreite und CPU bei den vielen Loop-Videos.
export function LazyVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [load, setLoad] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoad(true)
          void el.play().catch(() => {})
        } else {
          el.pause()
        }
      },
      { rootMargin: '300px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <video
      ref={ref}
      src={load ? src : undefined}
      className={className}
      preload="none"
      autoPlay
      muted
      loop
      playsInline
    />
  )
}
