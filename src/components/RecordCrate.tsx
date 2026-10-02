'use client'

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import Image from 'next/image'

type EmbedController = {
  loadUri: (uri: string) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  destroy: () => void
  addListener: (event: string, callback: (e: { data?: { isPaused?: boolean } }) => void) => void
}
type SpotifyIFrameApi = {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: EmbedController) => void
  ) => void
}

let spotifyApi: SpotifyIFrameApi | null = null
let spotifyApiPromise: Promise<SpotifyIFrameApi> | null = null

// Lädt die Spotify-iFrame-API erst beim ersten Klick auf eine Platte.
function loadSpotifyApi(): Promise<SpotifyIFrameApi> {
  if (spotifyApi) return Promise.resolve(spotifyApi)
  if (spotifyApiPromise) return spotifyApiPromise
  spotifyApiPromise = new Promise((resolve, reject) => {
    ;(window as unknown as { onSpotifyIframeApiReady?: (api: SpotifyIFrameApi) => void }).onSpotifyIframeApiReady = (api) => {
      spotifyApi = api
      resolve(api)
    }
    const script = document.createElement('script')
    script.src = 'https://open.spotify.com/embed/iframe-api/v1'
    script.async = true
    script.onerror = () => {
      spotifyApiPromise = null
      reject(new Error('spotify api blocked'))
    }
    document.body.appendChild(script)
  })
  return spotifyApiPromise
}

// Spotify-Link (Album/Track/Playlist/Künstler) -> URI wie spotify:album:ID
function spotifyUri(url?: string): string | null {
  const match = url?.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(album|track|playlist|artist)\/([A-Za-z0-9]+)/)
  return match ? `spotify:${match[1]}:${match[2]}` : null
}

export type RecordItem = {
  key: string
  title: string
  artist?: string
  year?: string
  note?: string
  src: string
  spotifyUrl?: string
}

const VISIBLE = 4
const DRAG_STEP = 70

// Plattenkiste zum Durchstöbern: Cover im 3D-Coverflow, mit der Maus ziehen,
// scrollen oder mit den Pfeiltasten durchblättern. Ein Klick auf das vordere
// Cover legt die Platte auf: sie fährt zur Hälfte aus der Hülle, dreht und
// der Track startet.
export function RecordCrate({ records }: { records: RecordItem[] }) {
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [apiFailed, setApiFailed] = useState(false)
  const [needsTap, setNeedsTap] = useState(false)
  const played = useRef(false)
  const tapTimer = useRef<number | undefined>(undefined)
  const stage = useRef<HTMLDivElement>(null)
  const embedHost = useRef<HTMLDivElement>(null)
  const controller = useRef<EmbedController | null>(null)
  const drag = useRef<{ x: number; step: number; moved: boolean } | null>(null)
  const wheelLock = useRef(0)

  const clamp = (i: number) => Math.min(records.length - 1, Math.max(0, i))
  const stop = () => {
    window.clearTimeout(tapTimer.current)
    setNeedsTap(false)
    setPlaying(false)
    controller.current?.pause()
  }
  const go = (i: number) => {
    setActive(clamp(i))
    stop()
  }

  useEffect(() => {
    const el = stage.current
    if (!el) return
    function onWheel(e: WheelEvent) {
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
      if (Math.abs(delta) < 8) return
      e.preventDefault()
      const now = performance.now()
      if (now - wheelLock.current < 220) return
      wheelLock.current = now
      setActive((i) => clamp(i + (delta > 0 ? 1 : -1)))
      stop()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  })

  useEffect(
    () => () => {
      controller.current?.destroy()
      controller.current = null
    },
    []
  )

  async function startTrack(uri: string) {
    // Auf Handys erlaubt der Browser den Start per Skript oft nicht: kommt
    // nach kurzer Zeit keine Wiedergabe, wird ein Hinweis zum Tippen gezeigt.
    played.current = false
    window.clearTimeout(tapTimer.current)
    tapTimer.current = window.setTimeout(() => {
      if (!played.current) setNeedsTap(true)
    }, 2200)
    if (window.innerWidth < 640) {
      window.setTimeout(() => embedHost.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 150)
    }
    try {
      const api = await loadSpotifyApi()
      if (controller.current) {
        controller.current.loadUri(uri)
        controller.current.play()
        return
      }
      const host = embedHost.current
      if (!host) return
      host.innerHTML = ''
      const el = document.createElement('div')
      host.appendChild(el)
      api.createController(el, { uri, width: '100%', height: 152 }, (c) => {
        controller.current = c
        c.addListener('ready', () => c.play())
        c.addListener('playback_update', (e) => {
          if (e.data?.isPaused === false) {
            played.current = true
            setNeedsTap(false)
          }
        })
      })
    } catch {
      setApiFailed(true)
    }
  }

  function toggleActive() {
    const uri = spotifyUri(records[active].spotifyUrl)
    if (playing) {
      stop()
      return
    }
    setPlaying(true)
    if (uri) void startTrack(uri)
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    drag.current = { x: e.clientX, step: 0, moved: false }
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    const state = drag.current
    if (!state) return
    const dx = e.clientX - state.x
    if (Math.abs(dx) > 6) state.moved = true
    const steps = Math.trunc(-dx / DRAG_STEP)
    if (steps !== state.step) {
      setActive((i) => clamp(i + (steps - state.step)))
      stop()
      state.step = steps
    }
  }
  function endDrag() {
    window.setTimeout(() => {
      drag.current = null
    }, 0)
  }

  const current = records[active]
  const currentUri = spotifyUri(current.spotifyUrl)

  return (
    <div className="flex flex-col gap-8">
      <div
        ref={stage}
        tabIndex={0}
        role="group"
        aria-label="Plattenkiste — mit Pfeiltasten durchblättern"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(active + 1)
          if (e.key === 'ArrowLeft') go(active - 1)
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="relative select-none touch-pan-y cursor-grab active:cursor-grabbing outline-none overflow-hidden"
        style={{ ['--cover' as string]: 'clamp(190px, 50vw, 280px)', height: 'calc(var(--cover) * 1.25)', perspective: '1400px' }}
      >
        {records.map((record, i) => {
          const offset = i - active
          if (Math.abs(offset) > VISIBLE) return null
          const isActive = offset === 0
          const side = Math.max(-1, Math.min(1, offset))
          return (
            <div
              key={record.key}
              className="absolute left-1/2 top-[8%]"
              style={{
                width: 'var(--cover)',
                height: 'var(--cover)',
                zIndex: 100 - Math.abs(offset),
                transform: `translateX(calc(-50% + var(--cover) * ${offset * 0.46 + side * (isActive ? 0 : 0.35)})) translateZ(${-Math.abs(offset) * 70}px) rotateY(${-side * 52}deg)`,
                transition: 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s ease',
                // Hintere Cover bleiben deckend und werden nur dunkler, damit sie
                // sich nicht optisch mit den vorderen vermischen.
                filter: isActive ? 'none' : `brightness(${Math.max(0.35, 1 - Math.abs(offset) * 0.2)})`,
                transformStyle: 'preserve-3d',
              }}
            >
              {isActive && (
                <>
                  {/* Platte: äusseres Element schiebt, inneres dreht (getrennt,
                      damit die Drehung die Schiebebewegung nicht mitnimmt). */}
                  <div
                    aria-hidden
                    className="absolute inset-[3%]"
                    style={{
                      transform: playing ? 'translateX(53%)' : 'translateX(0)',
                      transition: playing
                        ? 'transform 1.1s cubic-bezier(0.34, 1.35, 0.5, 1) 0.15s'
                        : 'transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div
                      className={`relative w-full h-full rounded-full ${playing ? 'record-spin' : ''}`}
                      style={{
                        background:
                          'radial-gradient(circle at center, #0a0a0a 0 2.5%, #d9d3c4 3% 5%, #d9423a 5.5% 19%, #0a0a0a 19.5% 21%, transparent 21.5%), conic-gradient(from 0deg, transparent 0 18%, rgba(255,255,255,0.16) 25%, transparent 32% 68%, rgba(255,255,255,0.16) 75%, transparent 82%), repeating-radial-gradient(circle at center, #111 0 2px, #1c1c1c 2px 4px)',
                        boxShadow: '0 6px 30px rgba(0,0,0,0.55)',
                      }}
                    >
                      <span
                        className="absolute rounded-full bg-[#f1f0eb]"
                        style={{ width: '3%', height: '3%', left: '50%', top: '31%', transform: 'translateX(-50%)' }}
                      />
                    </div>
                  </div>
                </>
              )}
              <button
                type="button"
                aria-label={`${record.title}${record.artist ? ` — ${record.artist}` : ''}`}
                onClick={() => {
                  if (drag.current?.moved) return
                  if (isActive) toggleActive()
                  else go(i)
                }}
                className="group absolute inset-0 overflow-hidden shadow-2xl transition-transform duration-500 ease-out hover:-translate-y-1.5"
                style={isActive && playing ? { transform: 'translateX(-4%)' } : undefined}
              >
                <Image
                  src={record.src}
                  alt=""
                  fill
                  sizes="280px"
                  draggable={false}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                {isActive && !playing && currentUri && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/35 transition-colors duration-500">
                    <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#f1f0eb] text-[#0a0a0a] opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500">
                      ▶
                    </span>
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </div>

      {currentUri && (
        <div className="flex flex-col gap-3 max-w-xl">
          {!playing && <span className="text-sm text-[var(--ink-muted)]">Platte anklicken — sie wird aufgelegt und der Track startet.</span>}
          {playing && needsTap && (
            <span className="archive-tile inline-flex items-center gap-2 self-start h-9 px-4 rounded-full bg-[var(--ink)] text-[var(--bg)] text-sm font-medium">
              Tippe im Player auf ▶, damit der Track startet
            </span>
          )}
          <div ref={embedHost} className={playing ? 'archive-tile' : 'hidden'} />
          {playing && apiFailed && (
            <iframe
              title={`${current.title} auf Spotify`}
              src={`https://open.spotify.com/embed/${currentUri.split(':')[1]}/${currentUri.split(':')[2]}?theme=0`}
              width="100%"
              height="152"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="rounded-xl border-0"
            />
          )}
          <span className="text-xs text-[var(--ink-muted)]">
            {playing && 'Beim Laden werden Daten an Spotify übertragen. '}
            <a href={current.spotifyUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              In Spotify öffnen ↗
            </a>
          </span>
        </div>
      )}

      <div key={current.key} className="archive-tile flex flex-wrap items-end justify-between gap-x-10 gap-y-3 max-w-4xl">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-4 font-medium" style={{ fontSize: 'clamp(1.5rem, 1rem + 2vw, 2.75rem)', letterSpacing: '-0.03em' }}>
            {current.title}
            {playing && (
              <span aria-hidden className="flex items-end gap-[3px] h-5">
                {[0, 1, 2, 3].map((bar) => (
                  <span key={bar} className="eq-bar w-[3px] bg-current rounded-full" style={{ animationDelay: `${bar * 0.18}s` }} />
                ))}
              </span>
            )}
          </span>
          <span className="text-[var(--ink-muted)]">{[current.artist, current.year].filter(Boolean).join(' · ')}</span>
        </div>
        {current.note && <p className="max-w-md text-sm text-[var(--ink-muted)]">{current.note}</p>}
        <span className="text-xs text-[var(--ink-muted)]">
          {active + 1} / {records.length} · ziehen, scrollen oder anklicken
        </span>
      </div>
    </div>
  )
}
