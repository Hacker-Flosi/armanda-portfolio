import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ArtworkList } from '@/components/ArtworkList'
import { getArtworks } from '@/sanity/lib/queries'

export default async function Home() {
  const artworks = await getArtworks()

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <ArtworkList artworks={artworks} />
      </main>
      <SiteFooter />
    </>
  )
}
