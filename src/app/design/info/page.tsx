import { DesignHeader } from '@/components/DesignHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { SectionTag } from '@/components/SectionTag'
import { getDesignAbout } from '@/sanity/lib/queries'

export const revalidate = 60

export default async function DesignInfoPage() {
  const about = await getDesignAbout()

  return (
    <>
      <DesignHeader />
      <main className="flex-1 px-4 py-10 flex flex-col gap-10 max-w-3xl">
        <div className="flex flex-col gap-4">
          <SectionTag>01 — Profil</SectionTag>
          <p className="whitespace-pre-line text-3xl sm:text-4xl font-medium leading-[0.95] tracking-tight">
            {about?.bio}
          </p>
        </div>

        {about?.services && about.services.length > 0 && (
          <div className="flex flex-col gap-4">
            <SectionTag>02 — Leistungen</SectionTag>
            <ul className="flex flex-col gap-1 text-lg">
              {about.services.map((service, i) => (
                <li key={i}>{service}</li>
              ))}
            </ul>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  )
}
