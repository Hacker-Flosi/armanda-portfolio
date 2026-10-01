import Image from 'next/image'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getAbout } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { ParallaxReveal } from '@/components/ParallaxReveal'
import { ContinueToWorksHint } from '@/components/ContinueToWorksHint'

export const revalidate = 60

export default async function InfoPage() {
  const about = await getAbout()

  return (
    <>
      <SiteHeader />
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[2fr_3fr]">
        <ParallaxReveal className="relative w-full h-full min-h-[280px] md:min-h-0 overflow-hidden">
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
        <div className="px-3 pt-6 pb-4 flex flex-col gap-6">
          <p className="whitespace-pre-line text-lg leading-relaxed">{about?.bio}</p>

          {about?.exhibitions && about.exhibitions.length > 0 && (
            <div>
              <div className="bg-[var(--bar-bg)] text-[var(--bar-fg)] px-2 py-1 text-base">
                Ausstellungen
              </div>
              <div>
                {about.exhibitions.map((exhibition, i) => {
                  const fields = [exhibition.year, exhibition.type, exhibition.title, exhibition.location].filter(
                    Boolean
                  )
                  return (
                    <div
                      key={i}
                      className="flex flex-wrap items-center gap-1.5 py-1.5 text-base border-t border-[var(--line)]"
                    >
                      {fields.map((field, j) => (
                        <span key={j} className="flex items-center gap-1.5">
                          {j > 0 && <span className="w-1.5 h-1.5 rounded-full bg-[var(--ink)]" />}
                          {field}
                        </span>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
      <ContinueToWorksHint />
    </>
  )
}
