import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Reveal } from '@/components/Reveal'
import { getSiteSettings } from '@/sanity/lib/queries'

export const revalidate = 60

export default async function ImpressumPage() {
  const settings = await getSiteSettings()
  const credits = settings?.impressumCredits ?? []

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-4 py-6 flex flex-col gap-6">
        <Reveal className="reveal-soft">
          {credits.map((credit, i) => (
            <p key={i} className="text-base">
              {credit.role}: {credit.name}
            </p>
          ))}
        </Reveal>
        <Reveal className="reveal-soft text-base">
          Grafikdesign-Portfolio:{' '}
          <Link href={settings?.designUrl ?? '/design'} className="underline">
            {settings?.designUrl ?? '/design'}
          </Link>
        </Reveal>
        <Reveal className="reveal-soft text-base">
          Illustration beauftragen:{' '}
          <Link href="/illustration" className="underline">
            /illustration
          </Link>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  )
}
