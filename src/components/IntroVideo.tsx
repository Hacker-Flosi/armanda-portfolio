'use client'

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <path d="M3 1.5v11l9-5.5z" />
    </svg>
  )
}

function RestartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M2.5 8a5.5 5.5 0 1 0 1.8-4.1M2.5 2.5v3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M2 6v4h3l4 3V3L5 6z" fill="currentColor" strokeLinejoin="round" />
      {on ? (
        <path d="M11.5 5.5a3.5 3.5 0 0 1 0 5M13.2 3.8a6 6 0 0 1 0 8.4" strokeLinecap="round" />
      ) : (
        <path d="M11.5 6l3 4M14.5 6l-3 4" strokeLinecap="round" />
      )}
    </svg>
  )
}

// Autoplay-Intro-Video. Desktop: ein Button folgt dem Cursor — erster Klick
// startet das Video von vorne (mit Ton), jeder weitere schaltet den Ton
// an/aus (Icon zeigt den Zustand). Der Ton geht beim Wegscrollen aus.
// Neustart-Button oben rechts; mobil zusätzlich Ton an/aus unten rechts.
export function IntroVideo({ src, poster, fill }: { src: string; poster?: string; fill?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const frame = useRef<number | null>(null)
  const [muted, setMuted] = useState(true)
  const [overVideo, setOverVideo] = useState(false)
  const [overControls, setOverControls] = useState(false)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    function tick() {
      current.current.x += (target.current.x - current.current.x) * 0.2
      current.current.y += (target.current.y - current.current.y) * 0.2
      const el = cursorRef.current
      if (el) el.style.transform = `translate(${current.current.x}px, ${current.current.y}px) translate(-50%, -50%)`
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) return
        const video = videoRef.current
        if (video && !video.muted) {
          video.muted = true
          setMuted(true)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function restart(withSound: boolean) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = 0
    if (withSound) {
      video.muted = false
      setMuted(false)
    }
    void video.play()
  }

  function toggleSound() {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const el = containerRef.current
    const rect = el?.getBoundingClientRect()
    if (!el || !rect || rect.width === 0) return
    // Der Container kann durch Hero-Animationen skaliert sein.
    const scale = el.offsetWidth / rect.width
    const x = (e.clientX - rect.left) * scale
    const y = (e.clientY - rect.top) * scale
    if (!overVideo) {
      current.current = { x, y }
      setOverVideo(true)
    }
    target.current = { x, y }
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-clip bg-black sm:cursor-none ${fill ? 'h-full' : ''}`}
      onMouseMove={handleMove}
      onMouseLeave={() => setOverVideo(false)}
      onClick={() => {
        if (!window.matchMedia('(min-width: 640px)').matches) return
        if (started) {
          toggleSound()
        } else {
          setStarted(true)
          restart(true)
        }
      }}
    >
      <div className="sticky top-12 z-10 h-0 flex justify-end pr-3 pointer-events-none">
        <button
          type="button"
          aria-label="Video von vorne starten"
          onClick={(e) => {
            e.stopPropagation()
            restart(false)
          }}
          onMouseEnter={() => setOverControls(true)}
          onMouseLeave={() => setOverControls(false)}
          className="pointer-events-auto mt-3 flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg)] text-[var(--ink)] sm:cursor-pointer"
        >
          <RestartIcon />
        </button>
      </div>

      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className={fill ? 'absolute left-0 -top-[12%] w-full h-[124%] object-cover will-change-transform' : 'block w-full h-auto'}
        style={fill ? { transform: 'translateY(var(--hero-par, 0px))' } : undefined}
        autoPlay
        muted
        loop
        playsInline
      />

      <div
        ref={cursorRef}
        aria-hidden
        className="hidden sm:flex absolute top-0 left-0 z-10 pointer-events-none items-center justify-center w-16 h-16 rounded-full bg-[var(--bg)] text-[var(--ink)] transition-opacity duration-200"
        style={{ opacity: overVideo && !overControls ? 1 : 0 }}
      >
        {started ? <SoundIcon on={!muted} /> : <PlayIcon />}
      </div>

      <button
        type="button"
        aria-label={muted ? 'Ton einschalten' : 'Ton ausschalten'}
        onClick={(e) => {
          e.stopPropagation()
          toggleSound()
        }}
        className="sm:hidden absolute bottom-3 right-3 z-20 flex items-center justify-center w-10 h-10 rounded-full bg-[var(--bg)] text-[var(--ink)]"
      >
        <SoundIcon on={!muted} />
      </button>
    </div>
  )
}
