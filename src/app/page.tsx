import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ArtworkList } from '@/components/ArtworkList'
import { ResolveFanTransition } from '@/components/ResolveFanTransition'
import { getArtworks } from '@/sanity/lib/queries'

export const revalidate = 60

export default async function Home() {
  const artworks = await getArtworks()

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <ArtworkList artworks={artworks} />
      </main>
      <SiteFooter />
      <ResolveFanTransition />
    </>
  )
}
