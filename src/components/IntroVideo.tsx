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

function FullscreenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" />
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

// Intro-Video mit zwei Dateien: ein kurzer, stummer Loop läuft automatisch im
// Hintergrund (schnell geladen); die lange Vollversion lädt nur ihre
// Metadaten vor und wird erst beim Tippen/Klicken abgespielt. Ohne Vollversion
// wird der Loop selbst mit Ton neu gestartet. Desktop: ein Button folgt dem
// Cursor — erster Klick startet die Vollversion von vorne (mit Ton), jeder
// weitere schaltet den Ton an/aus. Der Ton geht beim Wegscrollen aus und die
// Seite fällt auf den Loop zurück. Oben rechts: Vollbild und Neustart. Mobil:
// ein Play-Knopf in der Mitte startet die Vollversion im Vollbild.
export function IntroVideo({
  src,
  fullSrc,
  poster,
  fill,
}: {
  src?: string
  fullSrc?: string
  poster?: string
  fill?: boolean
}) {
  const loopSrc = src ?? fullSrc
  const hasFull = Boolean(src && fullSrc)
  const loopRef = useRef<HTMLVideoElement>(null)
  const fullRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const frame = useRef<number | null>(null)
  const modeRef = useRef<'loop' | 'full'>('loop')
  const [mode, setMode] = useState<'loop' | 'full'>('loop')
  const [muted, setMuted] = useState(true)
  const [overVideo, setOverVideo] = useState(false)
  const [overControls, setOverControls] = useState(false)
  const [started, setStarted] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const activeVideo = () => (modeRef.current === 'full' ? fullRef.current : loopRef.current)

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

  function setSound(on: boolean) {
    setMuted(!on)
    const video = activeVideo()
    if (video) video.muted = !on
  }

  // Zurück zum stummen Hintergrund-Loop.
  function exitFull() {
    if (modeRef.current === 'full') {
      const full = fullRef.current
      if (full) {
        full.pause()
        full.currentTime = 0
      }
      modeRef.current = 'loop'
      setMode('loop')
      setBuffering(false)
      void loopRef.current?.play().catch(() => {})
    }
    const loop = loopRef.current
    if (loop) loop.muted = true
    setMuted(true)
    setStarted(false)
  }

  // Vollversion starten (von vorne, mit Ton). Das Vollversions-Element hat
  // seine Metadaten schon geladen, deshalb funktioniert auch Vollbild direkt
  // aus dem Tipp heraus (iOS).
  function startFull(options?: { fullscreen?: boolean }) {
    const full = fullRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
    if (!full || !hasFull) {
      // Nur ein Video vorhanden: den Loop selbst von vorne mit Ton abspielen.
      const loop = loopRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null
      if (!loop) return
      loop.currentTime = 0
      loop.muted = false
      setMuted(false)
      void loop.play()
      if (options?.fullscreen) {
        if (loop.requestFullscreen) void loop.requestFullscreen().catch(() => {})
        else loop.webkitEnterFullscreen?.()
      }
      return
    }
    loopRef.current?.pause()
    modeRef.current = 'full'
    setMode('full')
    setBuffering(true)
    full.currentTime = 0
    full.muted = false
    setMuted(false)
    void full.play().catch(() => {})
    if (options?.fullscreen) {
      if (full.requestFullscreen) void full.requestFullscreen().catch(() => {})
      else full.webkitEnterFullscreen?.()
    }
  }

  // Ton aus und zurück zum Loop, sobald das Video aus dem Bild scrollt.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) return
        if (modeRef.current === 'full') exitFull()
        else if (loopRef.current && !loopRef.current.muted) setSound(false)
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Vollbild verlassen: Loop läuft wieder stumm als Hintergrund.
  useEffect(() => {
    const videos = [loopRef.current, fullRef.current] as ((HTMLVideoElement & { webkitendfullscreen?: unknown }) | null)[]
    function onChange() {
      const active = Boolean(document.fullscreenElement)
      setIsFullscreen(active)
      if (active) return
      exitFull()
      void loopRef.current?.play().catch(() => {})
    }
    function onWebkitExit() {
      exitFull()
      void loopRef.current?.play().catch(() => {})
    }
    document.addEventListener('fullscreenchange', onChange)
    for (const video of videos) video?.addEventListener('webkitendfullscreen', onWebkitExit)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      for (const video of videos) video?.removeEventListener('webkitendfullscreen', onWebkitExit)
    }
  }, [])

  function toggleSound() {
    const video = activeVideo()
    if (video) setSound(video.muted)
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

  const videoClass = fill
    ? 'absolute left-0 -top-[12%] w-full h-[124%] object-cover will-change-transform [&:fullscreen]:object-contain'
    : 'block w-full h-auto [&:fullscreen]:object-contain'
  const videoStyle = fill ? { transform: 'translateY(var(--hero-par, 0px))' } : undefined

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
          startFull()
        }
      }}
    >
      <div
        className="absolute top-0 right-0 z-10 flex gap-2 pr-3 pointer-events-none"
        style={{ transform: 'translateY(var(--icon-shift, 0px))' }}
      >
        <button
          type="button"
          aria-label="Video im Vollbild abspielen"
          onClick={(e) => {
            e.stopPropagation()
            setStarted(true)
            startFull({ fullscreen: true })
          }}
          onMouseEnter={() => setOverControls(true)}
          onMouseLeave={() => setOverControls(false)}
          className="pointer-events-auto mt-3 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg)] text-[var(--ink)] sm:cursor-pointer"
        >
          <FullscreenIcon />
        </button>
        <button
          type="button"
          aria-label="Video von vorne starten"
          onClick={(e) => {
            e.stopPropagation()
            setStarted(true)
            startFull()
          }}
          onMouseEnter={() => setOverControls(true)}
          onMouseLeave={() => setOverControls(false)}
          className="pointer-events-auto mt-3 hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-[var(--bg)] text-[var(--ink)] sm:cursor-pointer"
        >
          <RestartIcon />
        </button>
      </div>

      <video
        ref={loopRef}
        src={loopSrc}
        poster={poster}
        className={videoClass}
        style={videoStyle}
        autoPlay
        muted
        loop
        playsInline
        preload={poster ? 'metadata' : 'auto'}
      />

      {/* Vollversion: lädt nur Metadaten vor, liegt unsichtbar darüber und wird erst beim Start sichtbar. */}
      {hasFull && (
        <video
          ref={fullRef}
          src={fullSrc}
          poster={poster}
          className={`${videoClass} ${mode === 'full' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={videoStyle}
          playsInline
          preload="metadata"
          controls={isFullscreen}
          onEnded={exitFull}
          onWaiting={() => modeRef.current === 'full' && setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onCanPlay={() => setBuffering(false)}
        />
      )}

      {buffering && mode === 'full' && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center pointer-events-none" aria-label="Video lädt">
          <span className="video-spinner block w-10 h-10 rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}

      {/* Mobil: ein einzelner Play-Knopf in der Mitte, startet das Video mit Ton im Vollbild. */}
      <button
        type="button"
        aria-label="Video mit Ton im Vollbild abspielen"
        onClick={(e) => {
          e.stopPropagation()
          setStarted(true)
          startFull({ fullscreen: true })
        }}
        className="sm:hidden absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[72px] h-[72px] rounded-full bg-[var(--bg)]/90 text-[var(--ink)] backdrop-blur"
        style={{ opacity: mode === 'full' && !isFullscreen ? 0 : 1, pointerEvents: mode === 'full' ? 'none' : undefined }}
      >
        <span className="scale-[1.6] translate-x-[1px]">
          <PlayIcon />
        </span>
      </button>

      <div
        ref={cursorRef}
        aria-hidden
        className="hidden sm:flex absolute top-0 left-0 z-10 pointer-events-none items-center justify-center w-16 h-16 rounded-full bg-[var(--bg)] text-[var(--ink)] transition-opacity duration-200"
        style={{ opacity: overVideo && !overControls ? 1 : 0 }}
      >
        {started ? <SoundIcon on={!muted} /> : <PlayIcon />}
      </div>
    </div>
  )
}
