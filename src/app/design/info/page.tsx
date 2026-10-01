import { DesignHeader } from '@/components/DesignHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { SectionTag } from '@/components/SectionTag'
import { CursorImageList } from '@/components/CursorImageList'
import { getDesignAbout, getDesignWorks } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

export const revalidate = 60

export default async function DesignInfoPage() {
  const [about, works] = await Promise.all([getDesignAbout(), getDesignWorks()])

  const workItems = works.flatMap((work) => {
    const coverPos = work.images?.findIndex((entry) => entry.isMobileCover) ?? -1
    const cover = work.images?.[coverPos === -1 ? 0 : coverPos]
    if (!cover) return []
    return [
      {
        id: work._id,
        title: work.title,
        subtitle: [work.category, work.year].filter(Boolean).join(' · '),
        src: urlFor(cover.image).width(800).fit('max').auto('format').url(),
        aspectRatio: cover.aspectRatio,
      },
    ]
  })

  return (
    <>
      <DesignHeader />
      <main className="flex-1 px-4 py-10 flex flex-col gap-10 max-w-3xl">
        <div className="flex flex-col gap-4 md:relative">
          <SectionTag>01 — Profil</SectionTag>
          <p
            className="whitespace-pre-line font-medium md:pt-10"
            style={{ fontSize: 'clamp(1.9rem, 1.4rem + 2.1vw, 3.75rem)', lineHeight: '0.9em', letterSpacing: '-0.02em' }}
          >
            {about?.bio}
          </p>
        </div>

        {about?.approach && (
          <div className="flex flex-col gap-4 md:relative">
            <SectionTag>02 — Ansatz</SectionTag>
            <p
              className="whitespace-pre-line font-medium md:pt-10"
              style={{ fontSize: 'clamp(1.9rem, 1.4rem + 2.1vw, 3.75rem)', lineHeight: '0.9em', letterSpacing: '-0.02em' }}
            >
              {about.approach}
            </p>
          </div>
        )}

        {workItems.length > 0 && (
          <div className="flex flex-col gap-4 md:relative">
            <SectionTag>03 — Arbeiten</SectionTag>
            <div className="md:pt-10">
              <CursorImageList items={workItems} />
            </div>
          </div>
        )}

        {((about?.services && about.services.length > 0) ||
          (about?.clients && about.clients.length > 0) ||
          (about?.industries && about.industries.length > 0)) && (
          <div className="flex flex-col gap-4 md:relative">
            <SectionTag>04 — Info</SectionTag>
            <div className="flex flex-col gap-6 text-lg md:pt-10">
              {about?.services && about.services.length > 0 && (
                <div>
                  <h3 className="text-sm text-[var(--ink-muted)] mb-1">Leistungen</h3>
                  <ul className="flex flex-col gap-1">
                    {about.services.map((service, i) => (
                      <li key={i}>{service}</li>
                    ))}
                  </ul>
                </div>
              )}
              {about?.clients && about.clients.length > 0 && (
                <div>
                  <h3 className="text-sm text-[var(--ink-muted)] mb-1">Kunden</h3>
                  <p>{about.clients.join(', ')}</p>
                </div>
              )}
              {about?.industries && about.industries.length > 0 && (
                <div>
                  <h3 className="text-sm text-[var(--ink-muted)] mb-1">Branchen</h3>
                  <p>{about.industries.join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
