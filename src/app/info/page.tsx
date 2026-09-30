import Image from 'next/image'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getAbout } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

export default async function InfoPage() {
  const about = await getAbout()

  return (
    <>
      <SiteHeader />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-2">
        <div className="relative min-h-[280px] md:min-h-0">
          {about?.photo && (
            <Image
              src={urlFor(about.photo).width(1200).auto('format').url()}
              alt="Armanda Asani"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          )}
        </div>
        <div className="px-4 py-6 flex flex-col gap-6">
          <p className="whitespace-pre-line text-sm leading-relaxed">{about?.bio}</p>

          {about?.exhibitions && about.exhibitions.length > 0 && (
            <div>
              <div className="bg-[var(--bar-bg)] text-[var(--bar-fg)] px-3 py-1.5 text-sm">
                Ausstellungen
              </div>
              <div>
                {about.exhibitions.map((exhibition, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-4 gap-2 px-3 py-1.5 text-xs border-t border-[var(--line)]"
                  >
                    <span>{exhibition.year}</span>
                    <span className="text-[var(--ink-muted)]">{exhibition.type}</span>
                    <span>{exhibition.title}</span>
                    <span className="text-[var(--ink-muted)]">{exhibition.location}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
