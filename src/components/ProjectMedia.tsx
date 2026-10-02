'use client'

import { useState } from 'react'
import Image from 'next/image'
import { LazyVideo } from '@/components/LazyVideo'
import type { MediaTile } from '@/lib/designMedia'
import { AutoSlider } from '@/components/AutoSlider'
import { MobileProjectCarousel } from '@/components/MobileProjectCarousel'
import { SeriesDetail } from '@/components/SeriesDetail'
import { EnlargeBadge } from '@/components/EnlargeBadge'

// Medienreihe eines Projekts: Klick öffnet die Detailansicht (Lightbox) mit
// allen Bildern und Videos des Projekts.
export function ProjectMedia({
  title,
  lane,
  year,
  note,
  tiles,
}: {
  title: string
  lane: string
  year?: string
  note?: string
  tiles: MediaTile[]
}) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <>
      <div className="sm:hidden h-full">
        <MobileProjectCarousel
          items={tiles.map((tile) => ({ key: tile.key, kind: tile.kind, src: tile.src, aspectRatio: tile.aspectRatio }))}
          label={title}
          onOpen={setOpen}
        />
      </div>
      <AutoSlider className="hidden sm:block h-full">
        {tiles.map((tile, index) => (
          <button
            key={tile.key}
            type="button"
            aria-label={`${title} — Medium ${index + 1} vergrössern`}
            onClick={() => setOpen(index)}
            className="relative shrink-0 overflow-hidden bg-white/[0.04] h-[min(100%,calc(88vw/var(--ratio)))] md:h-full group"
            style={{ aspectRatio: tile.kind === 'video' ? 16 / 9 : (tile.aspectRatio ?? 1.3), ['--ratio' as string]: tile.kind === 'video' ? 16 / 9 : (tile.aspectRatio ?? 1.3) }}
          >
            {tile.kind === 'video' ? (
              <LazyVideo src={tile.src} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <Image
                src={tile.src}
                alt={title}
                fill
                sizes="(min-width: 768px) 60vw, 80vw"
                draggable={false}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            )}
            <EnlargeBadge />
          </button>
        ))}
      </AutoSlider>

      {open !== null && (
        <SeriesDetail
          lane={lane}
          items={tiles.map((tile) => ({
            key: tile.key,
            title,
            kind: tile.kind,
            src: tile.src,
            fullSrc: tile.fullSrc,
            year,
            note,
          }))}
          startIndex={open}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  )
}
