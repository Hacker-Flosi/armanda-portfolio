'use client'

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { LazyVideo } from '@/components/LazyVideo'
import type { MediaTile } from '@/lib/designMedia'
import { CursorImagePool } from '@/components/CursorImagePool'
import { ArchiveOverlay } from '@/components/ArchiveOverlay'
import { MaskRevealText } from '@/components/MaskRevealText'
import { MobileArchiveReel } from '@/components/MobileArchiveReel'
import { FocusDim } from '@/components/FocusDim'

// Spielwiese: projektunabhängige Auseinandersetzungen. Desktop: leere
// Fläche, in der beim Bewegen des Cursors Bilder aufpoppen. Mobil (kein
// Cursor): kompaktes Raster. Dazu der Zugang zum Archiv mit allem.
function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <rect x="1.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="1.5" width="5" height="5" rx="1" />
      <rect x="1.5" y="9.5" width="5" height="5" rx="1" />
      <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
    </svg>
  )
}

export function Spielwiese({ playTiles, archiveTiles }: { playTiles: MediaTile[]; archiveTiles: MediaTile[] }) {
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [inside, setInside] = useState(false)
  const [pressed, setPressed] = useState(false)
  const areaRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })

  useEffect(() => {
    let frame = 0
    function tick() {
      current.current.x += (target.current.x - current.current.x) * 0.18
      current.current.y += (target.current.y - current.current.y) * 0.18
      const el = badgeRef.current
      if (el) el.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  function handleMove(e: MouseEvent<HTMLDivElement>) {
    const rect = areaRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (!inside) {
      current.current = { x, y }
      setInside(true)
    }
    target.current = { x, y }
  }
  // Mobil: bis zu 10 ausgewählte Arbeiten (erst Spielwiese, dann der Rest) als Reel.
  const reelTiles = [...playTiles, ...archiveTiles.filter((t) => !playTiles.some((p) => p.key === t.key))].slice(0, 10)
  const poolSource = playTiles.length > 0 ? playTiles : archiveTiles
  const pool = poolSource
    .filter((tile) => tile.kind === 'image')
    .map((tile) => ({ src: tile.src, aspectRatio: tile.aspectRatio }))

  const [overButton, setOverButton] = useState(false)

  const headerContent = (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <MaskRevealText
        text="Spielwiese — Auseinandersetzungen jenseits von Aufträgen: Experimente, Skizzen, Fundstücke."
        lineHeight={0.98}
        className="font-medium max-w-4xl pointer-events-none w-full md:w-auto md:flex-1 min-w-0"
        style={{ fontSize: 'clamp(1.5rem, 0.9rem + 2.4vw, 3rem)', letterSpacing: '-0.03em' }}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setArchiveOpen(true)
        }}
        onMouseEnter={() => setOverButton(true)}
        onMouseLeave={() => setOverButton(false)}
        className="pointer-events-auto sm:cursor-pointer shrink-0 px-5 h-11 rounded-full border border-[var(--ink)]/40 bg-[var(--bg)] hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors duration-300"
      >
        Archiv ansehen ({archiveTiles.length})
      </button>
    </div>
  )

  return (
    <FocusDim className="border-t border-[var(--line)]">
      <div className="sm:hidden px-4 pt-10 pb-6">{headerContent}</div>

      <div
        ref={areaRef}
        className="hidden sm:block relative cursor-none"
        style={{ height: '100vh' }}
        onMouseMove={handleMove}
        onMouseLeave={() => {
          setInside(false)
          setPressed(false)
        }}
        onMouseDown={() => setPressed(true)}
        onMouseUp={() => setPressed(false)}
        onClick={() => setArchiveOpen(true)}
        role="button"
        tabIndex={0}
        aria-label="Archiv öffnen"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setArchiveOpen(true)
        }}
      >
        <div className="absolute inset-0">
          <CursorImagePool pool={pool} />
        </div>
        <div className="absolute inset-x-0 top-0 z-10 px-4 pt-10 pointer-events-none">{headerContent}</div>
        <div ref={badgeRef} aria-hidden className="absolute top-0 left-0 z-20 pointer-events-none">
          <div
            className="-translate-x-1/2 -translate-y-1/2 flex items-center gap-2 pl-3 pr-4 h-11 rounded-full bg-[var(--ink)] text-[var(--bg)] text-sm font-medium whitespace-nowrap transition-[opacity,transform] duration-300 ease-out"
            style={{ opacity: inside && !overButton ? 1 : 0, transform: `scale(${inside && !overButton ? (pressed ? 0.92 : 1) : 0.6})` }}
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--bg)] text-[var(--ink)]">
              <GridIcon />
            </span>
            Archiv öffnen
          </div>
        </div>
      </div>

      <MobileArchiveReel tiles={reelTiles} total={archiveTiles.length} onOpen={() => setArchiveOpen(true)} />

      {archiveOpen && <ArchiveOverlay tiles={archiveTiles} onClose={() => setArchiveOpen(false)} />}
    </FocusDim>
  )
}
