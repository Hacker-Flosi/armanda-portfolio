import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ArtworkList } from '@/components/ArtworkList'
import { InfoFan } from '@/components/InfoFan'
import { ResolveFanTransition } from '@/components/ResolveFanTransition'
import { getAbout, getArtworks } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

export const revalidate = 60

export default async function Home() {
  const [artworks, about] = await Promise.all([getArtworks(), getAbout()])

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex flex-col">
        <ArtworkList artworks={artworks} />
        {about?.photo && (
          <div className="mt-auto">
            <InfoFan src={urlFor(about.photo).width(200).fit('max').auto('format').url()} alt="Armanda Asani" />
          </div>
        )}
      </main>
      <SiteFooter />
      <ResolveFanTransition />
    </>
  )
}
