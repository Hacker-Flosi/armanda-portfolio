'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { LazyVideo } from '@/components/LazyVideo'
import { SeriesDetail } from '@/components/SeriesDetail'
import { EnlargeBadge } from '@/components/EnlargeBadge'
import type { MediaTile } from '@/lib/designMedia'

// Spaltenzahl wie das frühere Mosaik: 2 / 3 / 4 je nach Breite.
function useColumnCount() {
  const [count, setCount] = useState(2)
  useEffect(() => {
    const update = () => setCount(window.innerWidth >= 1280 ? 4 : window.innerWidth >= 768 ? 3 : 2)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return count
}

// Vollbild-Archiv: alle Medien (Projekte + Spielwiese) aufgereiht in einem
// Mosaik. Einblenden/Ausblenden mit Fade, Kacheln erscheinen gestaffelt.
export function ArchiveOverlay({ tiles, onClose }: { tiles: MediaTile[]; onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  const [detail, setDetail] = useState<number | null>(null)
  const detailOpen = useRef(false)
  useEffect(() => {
    detailOpen.current = detail !== null
  }, [detail])
  const rootRef = useRef<HTMLDivElement>(null)
  const columnCount = useColumnCount()

  // Kacheln auf Spalten verteilen: immer in die aktuell kürzeste Spalte,
  // damit die Spalten ähnlich lang bleiben (Reihenfolge bleibt erhalten).
  const columns = useMemo(() => {
    const cols: { index: number; tile: MediaTile }[][] = Array.from({ length: columnCount }, () => [])
    const heights = Array.from({ length: columnCount }, () => 0)
    tiles.forEach((tile, index) => {
      const target = heights.indexOf(Math.min(...heights))
      cols[target].push({ index, tile })
      heights[target] += 1 / (tile.kind === 'video' ? 16 / 9 : (tile.aspectRatio ?? 1.3))
    })
    return cols
  }, [tiles, columnCount])

  // Parallax: die Medien gleiten in ihren Kacheln leicht gegen die
  // Scrollrichtung (nur Desktop mit Maus).
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    if (!window.matchMedia('(hover: hover) and (min-width: 768px)').matches) return
    let frame = 0
    const media = new Map<Element, HTMLElement | null>()

    function update() {
      frame = 0
      const viewCenter = window.innerHeight / 2
      root!.querySelectorAll<HTMLElement>('[data-par-tile]').forEach((tile) => {
        const rect = tile.getBoundingClientRect()
        if (rect.bottom < -80 || rect.top > window.innerHeight + 80) return
        let el = media.get(tile)
        if (el === undefined) {
          el = tile.querySelector<HTMLElement>('img, video')
          if (el) el.style.transition = 'scale 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
          media.set(tile, el)
        }
        if (!el) return
        const p = Math.max(-1, Math.min(1, (rect.top + rect.height / 2 - viewCenter) / (viewCenter + rect.height / 2)))
        el.style.transform = `translate3d(0, ${(-p * rect.height * 0.07).toFixed(1)}px, 0) scale(1.16)`
      })
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    root.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const first = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(first)
      if (frame) cancelAnimationFrame(frame)
      root.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [columns])

  function requestClose() {
    if (closing) return
    setClosing(true)
    window.setTimeout(onClose, 300)
  }

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      // Esc schliesst zuerst die Detailansicht (die hört selbst darauf), nicht das Archiv.
      if (e.key === 'Escape' && !detailOpen.current) {
        setClosing(true)
        window.setTimeout(onClose, 300)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={rootRef}
      role="dialog"
      aria-modal
      data-lenis-prevent
      aria-label="Archiv"
      className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[#0a0a0a] text-[#f1f0eb] ${closing ? 'archive-overlay-out' : 'archive-overlay-in'}`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 bg-[#0a0a0a]/90 backdrop-blur">
        <span className="font-medium">Archiv · {tiles.length}</span>
        <button type="button" onClick={requestClose} className="px-3 h-8 rounded-full border border-[#f1f0eb]/30 text-sm hover:bg-[#f1f0eb] hover:text-[#0a0a0a] transition-colors">
          Schliessen
        </button>
      </div>

      <div className="flex gap-2 px-2 pt-6 pb-40 items-start">
        {columns.map((column, ci) => (
          <div
            key={ci}
            className="flex-1 min-w-0 flex flex-col gap-2"
          >
            {column.map(({ tile, index: i }) => (
              <figure key={tile.key} className="archive-tile" style={{ animationDelay: `${Math.min(i, 20) * 45 + 150}ms` }}>
                <button
                  type="button"
                  aria-label={`${tile.label} vergrössern`}
                  onClick={() => setDetail(i)}
                  data-par-tile
                  className="group relative block w-full overflow-hidden"
                >
                  {tile.kind === 'video' ? (
                    <LazyVideo src={tile.src} className="block w-full h-auto" />
                  ) : (
                    <div className="relative w-full" style={{ aspectRatio: tile.aspectRatio ?? 1.3 }}>
                      <Image
                        src={tile.src}
                        alt={tile.label}
                        fill
                        sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
                        draggable={false}
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                  )}
                  <EnlargeBadge />
                </button>
                <figcaption className="px-0.5 pt-1 text-xs text-[#8a8a85]">{tile.label}</figcaption>
              </figure>
            ))}
          </div>
        ))}
      </div>
      {detail !== null && (
        <SeriesDetail
          lane="Archiv"
          items={tiles.map((tile) => ({
            key: tile.key,
            title: tile.label,
            kind: tile.kind,
            src: tile.src,
            fullSrc: tile.fullSrc,
          }))}
          startIndex={detail}
          onClose={() => setDetail(null)}
        />
      )}
    </div>,
    document.body
  )
}
