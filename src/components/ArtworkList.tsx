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
        style={{ background: status === 'verfuegbar' ? 'var(--available)' : 'var(--sold)' }}
      />
      {STATUS_LABEL[status]}
    </span>
  )
}

function ArtworkImages({ artwork }: { artwork: Artwork }) {
  if (!artwork.images || artwork.images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] flex items-center justify-center text-xs text-[var(--ink-muted)] bg-black/[0.03]">
        Bild folgt
      </div>
    )
  }

  if (artwork.images.length === 1) {
    const entry = artwork.images[0]
    return (
      <div className="relative w-full" style={{ aspectRatio: entry.aspectRatio ?? 1.3 }}>
        <Image
          src={urlFor(entry.image).width(1800).fit('max').auto('format').url()}
          alt={artwork.title}
          fill
          sizes="100vw"
          className="object-contain object-left"
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-0.5 aspect-[16/10]">
      {artwork.images.slice(0, 2).map((entry, i) => (
        <div key={i} className="relative h-full w-full">
          <Image
            src={urlFor(entry.image).width(1200).fit('max').auto('format').url()}
            alt={artwork.title}
            fill
            sizes="50vw"
            className="object-cover"
          />
        </div>
      ))}
    </div>
  )
}

function ArtworkRow({ artwork }: { artwork: Artwork }) {
  return (
    <div className="border-t border-[var(--line)] first:border-t-0">
      <div className="flex items-baseline justify-between px-4 py-3">
        <h2 className="font-medium">{artwork.title}</h2>
        <span className="text-[var(--ink-muted)] text-xs">Edition {artwork.edition ?? '1/1'}</span>
      </div>

      <ArtworkImages artwork={artwork} />

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
  )
}

export function ArtworkList({ artworks }: { artworks: Artwork[] }) {
  return (
    <div>
      {artworks.map((artwork) => (
        <ArtworkRow key={artwork._id} artwork={artwork} />
      ))}
    </div>
  )
}
