'use client'

import { useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import type { Artwork } from '@/sanity/lib/queries'

const STATUS_LABEL: Record<string, string> = {
  verfuegbar: 'verfügbar',
  verkauft: 'verkauft',
}

function StatusCell({ status }: { status?: Artwork['status'] }) {
  if (!status || status === 'none') return null
  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-block w-1.5 h-1.5 rounded-full"
        style={{ background: status === 'verfuegbar' ? 'var(--available)' : 'var(--ink-muted)' }}
      />
      {STATUS_LABEL[status]}
    </span>
  )
}

function ArtworkRow({
  artwork,
  isOpen,
  onToggle,
}: {
  artwork: Artwork
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-t border-[var(--line)] first:border-t-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-baseline justify-between px-4 py-3 text-left"
      >
        <span className="font-medium">{artwork.title}</span>
        <span className="text-[var(--ink-muted)] text-xs">Edition {artwork.edition ?? '1/1'}</span>
      </button>

      {isOpen && (
        <div>
          {artwork.image ? (
            <div className="relative w-full" style={{ aspectRatio: artwork.imageAspectRatio ?? 1.3 }}>
              <Image
                src={urlFor(artwork.image).width(1800).fit('max').auto('format').url()}
                alt={artwork.title}
                fill
                sizes="100vw"
                className="object-contain object-left"
                priority={false}
              />
            </div>
          ) : (
            <div className="w-full aspect-[4/3] flex items-center justify-center text-xs text-[var(--ink-muted)] bg-black/[0.03]">
              Bild folgt
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4 px-4 py-3 text-xs">
            <div>
              <div className="text-[var(--ink-muted)]">Jahr</div>
              <div>{artwork.year}</div>
            </div>
            <div>
              <div className="text-[var(--ink-muted)]">Masse</div>
              <div>{artwork.dimensions}</div>
            </div>
            <div>
              <div className="text-[var(--ink-muted)]">Medium</div>
              <div className="text-[var(--ink-muted)]">{artwork.medium}</div>
            </div>
            <div>
              <div className="text-[var(--ink-muted)]">Status</div>
              <div><StatusCell status={artwork.status} /></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ArtworkList({ artworks }: { artworks: Artwork[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div>
      {artworks.map((artwork) => (
        <ArtworkRow
          key={artwork._id}
          artwork={artwork}
          isOpen={openId === artwork._id}
          onToggle={() => setOpenId((current) => (current === artwork._id ? null : artwork._id))}
        />
      ))}
    </div>
  )
}
