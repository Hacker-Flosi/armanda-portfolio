import { urlFor } from '@/sanity/lib/image'
import type { DesignWork } from '@/sanity/lib/queries'
import { LightboxProvider, LightboxTrigger } from '@/components/Lightbox'
import { ParallaxReveal } from '@/components/ParallaxReveal'
import { MobileImageCarousel } from '@/components/MobileImageCarousel'

function DesignWorkImages({ work, indices }: { work: DesignWork; indices: number[] }) {
  if (!work.images || work.images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] flex items-center justify-center text-sm text-[var(--ink-muted)] bg-black/[0.03]">
        Bild folgt
      </div>
    )
  }

  if (work.images.length === 1) {
    const entry = work.images[0]
    return (
      <ParallaxReveal
        className="relative w-full mx-auto max-h-[88dvh] overflow-hidden"
        style={{ aspectRatio: entry.aspectRatio ?? 1.3, viewTransitionName: `design-work-${work._id}` }}
      >
        <LightboxTrigger
          index={indices[0]}
          src={urlFor(entry.image).width(1800).fit('max').auto('format').url()}
          alt={work.title}
          sizes="100vw"
          className="object-contain object-left"
        />
      </ParallaxReveal>
    )
  }

  const coverPos = work.images.findIndex((entry) => entry.isMobileCover)
  const startAt = coverPos === -1 ? 0 : coverPos
  const carouselImages = work.images.map((entry) => ({
    src: urlFor(entry.image).width(1800).fit('max').auto('format').url(),
    aspectRatio: entry.aspectRatio,
  }))

  return (
    <>
      {/* Mobil: wechselt automatisch durch alle Bilder, mit Fortschrittsanzeige */}
      <MobileImageCarousel
        images={carouselImages}
        alt={work.title}
        globalIndices={indices}
        startAt={startAt}
        viewTransitionName={`design-work-${work._id}`}
      />

      {/* Ab Tablet aufwärts: beide Bilder nebeneinander */}
      <div className="hidden sm:grid grid-cols-2 gap-0.5 aspect-[16/10] max-h-[88dvh]">
        {work.images.slice(0, 2).map((entry, i) => (
          <ParallaxReveal key={i} className="relative h-full w-full overflow-hidden">
            <LightboxTrigger
              index={indices[i]}
              src={urlFor(entry.image).width(1200).fit('max').auto('format').url()}
              alt={work.title}
              sizes="50vw"
              className="object-cover"
            />
          </ParallaxReveal>
        ))}
      </div>
    </>
  )
}

function DesignWorkRow({ work, indices }: { work: DesignWork; indices: number[] }) {
  return (
    <div className="border-t border-[var(--line)] first:border-t-0">
      <div className="flex items-baseline justify-between px-4 py-3">
        <h2 className="font-medium">{work.title}</h2>
        {work.category && <span className="text-[var(--ink-muted)] text-sm">{work.category}</span>}
      </div>

      <DesignWorkImages work={work} indices={indices} />

      <div className="px-4 py-3 flex flex-col gap-3 text-sm">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 gap-x-4">
          <div>
            <div className="text-[var(--ink-muted)]">Jahr</div>
            <div>{work.year}</div>
          </div>
          <div>
            <div className="text-[var(--ink-muted)]">Kunde</div>
            <div>{work.client}</div>
          </div>
          <div>
            <div className="text-[var(--ink-muted)]">Kategorie</div>
            <div>{work.category}</div>
          </div>
        </div>
        {work.description && <p className="text-[var(--ink-muted)]">{work.description}</p>}
      </div>
    </div>
  )
}

export function DesignWorkList({ works }: { works: DesignWork[] }) {
  const items: { fullSrc: string; alt: string }[] = []
  const indexMap: number[][] = works.map((work) => {
    const indices: number[] = []
    for (const entry of work.images ?? []) {
      indices.push(items.length)
      items.push({
        fullSrc: urlFor(entry.image).width(2800).fit('max').auto('format').url(),
        alt: work.title,
      })
    }
    return indices
  })

  return (
    <LightboxProvider items={items}>
      <div>
        {works.map((work, i) => (
          <DesignWorkRow key={work._id} work={work} indices={indexMap[i]} />
        ))}
      </div>
    </LightboxProvider>
  )
}
