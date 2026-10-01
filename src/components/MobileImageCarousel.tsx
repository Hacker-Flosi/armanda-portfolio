'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { useLightbox } from '@/components/Lightbox'
import { ParallaxReveal } from '@/components/ParallaxReveal'

const INTERVAL_MS = 4500

export type CarouselImage = { src: string; aspectRatio: number | null }

export function MobileImageCarousel({
  images,
  alt,
  globalIndices,
  startAt = 0,
  viewTransitionName,
}: {
  images: CarouselImage[]
  alt: string
  globalIndices: number[]
  startAt?: number
  viewTransitionName?: string
}) {
  const { open } = useLightbox()
  const [index, setIndex] = useState(startAt)
  const [inView, setInView] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fest auf das Start-Bild verankert, damit der Container beim Durchwechseln
  // nicht je nach Seitenverhältnis des aktuellen Bilds springt — andere
  // Formate werden stattdessen innerhalb der festen Box eingepasst.
  const boxAspectRatio = images[startAt]?.aspectRatio ?? 1.3

  useEffect(() => {
    setReduceMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.6 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const advancing = inView && !reduceMotion && images.length > 1

  useEffect(() => {
    if (!advancing) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % images.length)
    }, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [advancing, images.length])

  const current = images[index]
  const style = useMemo(
    () => ({ aspectRatio: boxAspectRatio, viewTransitionName }),
    [boxAspectRatio, viewTransitionName]
  )
  if (!current) return null

  return (
    <div
      ref={containerRef}
      className="sm:hidden relative w-full mx-auto max-h-[88dvh] overflow-hidden"
      style={style}
    >
      <ParallaxReveal className="absolute inset-0">
        <button
          type="button"
          onClick={() => open(globalIndices[index])}
          aria-label={`${alt} — Bild vergrössern`}
          className="absolute inset-0 w-full h-full cursor-zoom-in"
        >
          <Image src={current.src} alt={alt} fill sizes="100vw" className="object-contain object-left" />
        </button>
      </ParallaxReveal>

      {images.length > 1 && (
        <div className="absolute top-2 inset-x-2 flex gap-1 pointer-events-none">
          {images.map((_, i) => (
            <div key={i} className="h-0.5 flex-1 rounded-full bg-white/35 overflow-hidden">
              {i < index && <div className="h-full w-full bg-white" />}
              {i === index &&
                (advancing ? (
                  <div
                    key={index}
                    className="h-full bg-white carousel-fill"
                    style={{ animationDuration: `${INTERVAL_MS}ms` }}
                  />
                ) : (
                  <div className="h-full w-full bg-white" />
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
