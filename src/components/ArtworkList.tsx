import { urlFor } from '@/sanity/lib/image'
import type { Artwork } from '@/sanity/lib/queries'
import { LightboxProvider, LightboxTrigger } from '@/components/Lightbox'
import { ParallaxReveal } from '@/components/ParallaxReveal'
import { MobileImageCarousel } from '@/components/MobileImageCarousel'

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

function ArtworkImages({ artwork, indices }: { artwork: Artwork; indices: number[] }) {
  if (!artwork.images || artwork.images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] flex items-center justify-center text-sm text-[var(--ink-muted)] bg-[var(--ink)]/[0.05]">
        Bild folgt
      </div>
    )
  }

  if (artwork.images.length === 1) {
    const entry = artwork.images[0]
    return (
      <ParallaxReveal
        className="relative w-full mx-auto max-h-[88dvh] overflow-hidden"
        style={{ aspectRatio: entry.aspectRatio ?? 1.3, viewTransitionName: `fan-work-${artwork._id}` }}
      >
        <LightboxTrigger
          index={indices[0]}
          src={urlFor(entry.image).width(1800).fit('max').auto('format').url()}
          alt={artwork.title}
          sizes="100vw"
          className="object-contain object-left"
        />
      </ParallaxReveal>
    )
  }

  const coverPos = artwork.images.findIndex((entry) => entry.isMobileCover)
  const startAt = coverPos === -1 ? 0 : coverPos
  const carouselImages = artwork.images.map((entry) => ({
    src: urlFor(entry.image).width(1800).fit('max').auto('format').url(),
    aspectRatio: entry.aspectRatio,
  }))

  return (
    <>
      {/* Mobil: wechselt automatisch durch alle Bilder, mit Fortschrittsanzeige */}
      <MobileImageCarousel
        images={carouselImages}
        alt={artwork.title}
        globalIndices={indices}
        startAt={startAt}
        viewTransitionName={`fan-work-${artwork._id}`}
      />

      {/* Ab Tablet aufwärts: beide Bilder nebeneinander */}
      <div className="hidden sm:grid grid-cols-2 gap-0.5 aspect-[16/10] max-h-[88dvh]">
        {artwork.images.slice(0, 2).map((entry, i) => (
          <ParallaxReveal key={i} className="relative h-full w-full overflow-hidden">
            <LightboxTrigger
              index={indices[i]}
              src={urlFor(entry.image).width(1200).fit('max').auto('format').url()}
              alt={artwork.title}
              sizes="50vw"
              className="object-cover"
            />
          </ParallaxReveal>
        ))}
      </div>
    </>
  )
}

function ArtworkRow({ artwork, indices }: { artwork: Artwork; indices: number[] }) {
  return (
    <div className="border-t border-[var(--line)] first:border-t-0">
      <div className="flex items-baseline justify-between px-4 py-3">
        <h2 className="font-medium">{artwork.title}</h2>
        <span className="text-[var(--ink-muted)] text-sm">Edition {artwork.edition ?? '1/1'}</span>
      </div>

      <ArtworkImages artwork={artwork} indices={indices} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-2 gap-x-4 px-4 py-3 text-sm">
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
          <div>{artwork.medium}</div>
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
  const items: { fullSrc: string; alt: string; year?: string; note?: string }[] = []
  const indexMap: number[][] = artworks.map((artwork) => {
    const indices: number[] = []
    for (const entry of artwork.images ?? []) {
      indices.push(items.length)
      items.push({
        fullSrc: urlFor(entry.image).width(2800).fit('max').auto('format').url(),
        alt: artwork.title,
        year: artwork.year,
        note: [artwork.medium, artwork.dimensions].filter(Boolean).join(' · ') || undefined,
      })
    }
    return indices
  })

  return (
    <LightboxProvider items={items}>
      <div>
        {artworks.map((artwork, i) => (
          <ArtworkRow key={artwork._id} artwork={artwork} indices={indexMap[i]} />
        ))}
      </div>
    </LightboxProvider>
  )
}
