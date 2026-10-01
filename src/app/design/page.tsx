import { DesignHeader } from '@/components/DesignHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { DesignWorkList } from '@/components/DesignWorkList'
import { getDesignWorks } from '@/sanity/lib/queries'

export const revalidate = 60

export default async function DesignPage() {
  const works = await getDesignWorks()

  return (
    <>
      <DesignHeader />
      <main className="flex-1">
        <DesignWorkList works={works} />
      </main>
      <SiteFooter />
    </>
  )
}
