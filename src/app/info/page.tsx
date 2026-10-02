import Image from 'next/image'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getAbout, getArtworks } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { Reveal } from '@/components/Reveal'
import { MaskRevealText } from '@/components/MaskRevealText'
import { ParallaxReveal } from '@/components/ParallaxReveal'
import { WorksFan, type FanWork } from '@/components/WorksFan'
import { ResolveFanTransition } from '@/components/ResolveFanTransition'

export const revalidate = 60

const FAN_SIZE = 6

export default async function InfoPage() {
  const [about, artworks] = await Promise.all([getAbout(), getArtworks()])

  const fanWorks: FanWork[] = artworks.slice(0, FAN_SIZE).flatMap((artwork) => {
    if (!artwork.images || artwork.images.length === 0) return []
    const coverPos = artwork.images.findIndex((entry) => entry.isMobileCover)
    const cover = artwork.images[coverPos === -1 ? 0 : coverPos]
    return [
      {
        id: artwork._id,
        src: urlFor(cover.image).width(200).fit('max').auto('format').url(),
        alt: artwork.title,
      },
    ]
  })

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex flex-col md:grid md:grid-cols-[2fr_3fr]">
        <ParallaxReveal
          className="relative w-full min-h-[60dvh] md:h-full md:min-h-0 overflow-hidden"
          style={{ viewTransitionName: 'fan-info-photo' }}
        >
          {about?.photo && (
            <Image
              src={urlFor(about.photo).width(1200).auto('format').url()}
              alt="Armanda Asani"
              fill
              sizes="(min-width: 768px) 40vw, 100vw"
              className="object-cover"
            />
          )}
        </ParallaxReveal>
        <div className="px-3 pt-6 pb-4 flex flex-col gap-6 flex-1">
          <div className="flex flex-col gap-3">
            {(about?.bio ?? '')
              .split(/\n+/)
              .filter(Boolean)
              .map((paragraph, i) => (
                <MaskRevealText key={i} text={paragraph} lineHeight={1.4} className="text-lg" />
              ))}
          </div>

          {about?.exhibitions && about.exhibitions.length > 0 && (
            <div>
              <Reveal className="reveal-soft bg-[var(--bar-bg)] text-[var(--bar-fg)] px-2 py-1 text-base">
                Ausstellungen
              </Reveal>
              <div>
                {about.exhibitions.map((exhibition, i) => {
                  const fields = [exhibition.year, exhibition.type, exhibition.title, exhibition.location].filter(
                    Boolean
                  )
                  return (
                    <Reveal
                      key={i}
                      className="reveal-soft flex flex-wrap items-center gap-1.5 py-1.5 text-base border-t border-[var(--line)]"
                    >
                      {fields.map((field, j) => (
                        <span key={j} className="flex items-center gap-1.5">
                          {j > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)]" />}
                          {field}
                        </span>
                      ))}
                    </Reveal>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-auto">
            <WorksFan works={fanWorks} />
          </div>
        </div>
      </main>
      <SiteFooter />
      <ResolveFanTransition />
    </>
  )
}
