import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getSiteSettings } from '@/sanity/lib/queries'

export default async function ImpressumPage() {
  const settings = await getSiteSettings()
  const credits = settings?.impressumCredits ?? []

  return (
    <>
      <SiteHeader />
      <main className="flex-1 px-4 py-6">
        {credits.map((credit, i) => (
          <p key={i} className="text-sm">
            {credit.role}: {credit.name}
          </p>
        ))}
      </main>
      <SiteFooter />
    </>
  )
}
