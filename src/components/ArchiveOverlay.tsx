'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import { LazyVideo } from '@/components/LazyVideo'
import { SeriesDetail } from '@/components/SeriesDetail'
import { EnlargeBadge } from '@/components/EnlargeBadge'
import type { MediaTile } from '@/lib/designMedia'

// Vollbild-Archiv: alle Medien (Projekte + Spielwiese) aufgereiht in einem
// Mosaik. Einblenden/Ausblenden mit Fade, Kacheln erscheinen gestaffelt.
export function ArchiveOverlay({ tiles, onClose }: { tiles: MediaTile[]; onClose: () => void }) {
  const [closing, setClosing] = useState(false)
  const [detail, setDetail] = useState<number | null>(null)
  const detailOpen = useRef(false)
  detailOpen.current = detail !== null

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
      role="dialog"
      aria-modal
      aria-label="Archiv"
      className={`fixed inset-0 z-50 overflow-y-auto bg-[#0a0a0a] text-[#f1f0eb] ${closing ? 'archive-overlay-out' : 'archive-overlay-in'}`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-12 bg-[#0a0a0a]/90 backdrop-blur">
        <span className="font-medium">Archiv · {tiles.length}</span>
        <button type="button" onClick={requestClose} className="px-3 h-8 rounded-full border border-[#f1f0eb]/30 text-sm hover:bg-[#f1f0eb] hover:text-[#0a0a0a] transition-colors">
          Schliessen
        </button>
      </div>

      <div className="columns-2 md:columns-3 xl:columns-4 gap-2 px-2 pb-16">
        {tiles.map((tile, i) => (
          <figure
            key={tile.key}
            className="archive-tile break-inside-avoid mb-2"
            style={{ animationDelay: `${Math.min(i, 20) * 45 + 150}ms` }}
          >
            <button
              type="button"
              aria-label={`${tile.label} vergrössern`}
              onClick={() => setDetail(i)}
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
