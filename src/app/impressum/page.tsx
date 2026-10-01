import Link from 'next/link'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getSiteSettings } from '@/sanity/lib/queries'

export const revalidate = 60

export default async function ImpressumPage() {
  const settings = await getSiteSettings()
  const credits = settings?.impressumCredits ?? []

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-4 py-6 flex flex-col gap-6">
        <div>
          {credits.map((credit, i) => (
            <p key={i} className="text-base">
              {credit.role}: {credit.name}
            </p>
          ))}
        </div>
        <p className="text-base">
          Grafikdesign-Portfolio:{' '}
          <Link href={settings?.designUrl ?? '/design'} className="underline">
            {settings?.designUrl ?? '/design'}
          </Link>
        </p>
      </main>
      <SiteFooter />
    </>
  )
}
