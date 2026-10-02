'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AutoSlider } from '@/components/AutoSlider'
import { SeriesDetail } from '@/components/SeriesDetail'
import { MobileProjectCarousel } from '@/components/MobileProjectCarousel'
import { EnlargeBadge } from '@/components/EnlargeBadge'

export type PhotoItem = { key: string; title: string; note?: string; src: string; fullSrc: string; aspectRatio: number | null }

// Private Fotos als ziehbare Reihe (Drag-Cursor, Schwung, Endlosschleife);
// Klick öffnet die Detailansicht mit Bildunterschrift.
export function PhotoStrip({ photos }: { photos: PhotoItem[] }) {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <>
      <div className="h-[60dvh] sm:h-[52dvh]">
        <div className="sm:hidden h-full">
          <MobileProjectCarousel
            items={photos.map((photo) => ({ key: photo.key, kind: 'image' as const, src: photo.src, aspectRatio: photo.aspectRatio, caption: photo.title }))}
            label="Privat"
            onOpen={setOpen}
          />
        </div>
        <AutoSlider className="hidden sm:block h-full">
          {photos.map((photo, index) => (
            <button
              key={photo.key}
              type="button"
              aria-label={`${photo.title} vergrössern`}
              onClick={() => setOpen(index)}
              className="group relative shrink-0 overflow-hidden bg-white/[0.04] h-[min(100%,calc(88vw/var(--ratio)))] md:h-full"
              style={{ aspectRatio: photo.aspectRatio ?? 1, ['--ratio' as string]: photo.aspectRatio ?? 1 }}
            >
              <Image
                src={photo.src}
                alt={photo.title}
                fill
                sizes="(min-width: 768px) 40vw, 70vw"
                draggable={false}
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              />
              <span className="absolute left-3 bottom-3 text-xs text-white/85 opacity-0 translate-y-1 transition-all duration-500 group-hover:opacity-100 group-hover:translate-y-0">
                {photo.title}
              </span>
              <EnlargeBadge />
            </button>
          ))}
        </AutoSlider>
      </div>

      {open !== null && (
        <SeriesDetail
          lane="Privat"
          items={photos.map((photo) => ({
            key: photo.key,
            title: photo.title,
            kind: 'image' as const,
            src: photo.src,
            fullSrc: photo.fullSrc,
            note: photo.note,
          }))}
          startIndex={open}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  )
}
