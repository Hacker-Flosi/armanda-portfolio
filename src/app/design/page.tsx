import { DARK_THEME } from '@/lib/theme'
import { ResolveFanTransition } from '@/components/ResolveFanTransition'
import { DesignHeader } from '@/components/DesignHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { DesignProjects } from '@/components/DesignProjects'
import { Hero } from '@/components/Hero'
import { ContactSection } from '@/components/ContactSection'
import type { Metadata } from 'next'
import { urlFor } from '@/sanity/lib/image'
import { StackSection } from '@/components/StackSection'
import { Spielwiese } from '@/components/Spielwiese'
import { ProjectClusters } from '@/components/ProjectClusters'
import { playToTiles, timelineToTiles, timelineToView, worksToTiles } from '@/lib/designMedia'
import { getDesignAbout, getDesignPlay, getDesignTimelines, getDesignWorks, getSiteSettings } from '@/sanity/lib/queries'

export const revalidate = 60


export async function generateMetadata(): Promise<Metadata> {
  const [about, works] = await Promise.all([getDesignAbout(), getDesignWorks()])
  const cover = works.flatMap((work) => work.images ?? []).find((entry) => entry.image)
  const title = 'Armanda Asani — Grafikdesign'
  const description =
    about?.introText ?? 'Portfolio von Armanda Asani: Grafikdesign zwischen Editorial, Branding und Illustration.'
  const image = cover?.image ? urlFor(cover.image).width(1200).height(630).fit('crop').auto('format').url() : undefined
  return {
    title,
    description,
    openGraph: { title, description, type: 'website', locale: 'de_CH', images: image ? [{ url: image, width: 1200, height: 630 }] : undefined },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image] : undefined },
  }
}

export default async function DesignPage() {
  const [works, about, play, timelineDocs, settings] = await Promise.all([
    getDesignWorks(),
    getDesignAbout(),
    getDesignPlay(),
    getDesignTimelines(),
    getSiteSettings(),
  ])
  const mailHref = settings?.mailAddress
    ? `mailto:${settings.mailAddress}${settings.mailSubject ? `?subject=${encodeURIComponent(settings.mailSubject)}` : ''}`
    : undefined
  const timelines = timelineDocs.map(timelineToView)
  const playTiles = playToTiles(play)
  const archiveTiles = [...worksToTiles(works), ...timelines.flatMap(timelineToTiles), ...playTiles]

  return (
    <>
      <ResolveFanTransition />
      <DesignHeader />
      <main className="flex-1 bg-[var(--bg)] text-[var(--ink)]" style={DARK_THEME}>
        <Hero introText={about?.introText} videoSrc={about?.introVideoUrl} mailHref={mailHref} mailAddress={settings?.mailAddress} />
        <div>
          <DesignProjects works={works} />
          {timelines.map((timeline, i) => (
            <StackSection key={timeline.id} index={works.length + i} className="border-t border-[var(--line)]">
              <ProjectClusters timeline={timeline} />
            </StackSection>
          ))}
        </div>
        <Spielwiese playTiles={playTiles} archiveTiles={archiveTiles} />
        <ContactSection mailHref={mailHref} mailAddress={settings?.mailAddress} hasCv={Boolean(settings?.cvUrl)} />
      </main>
      <SiteFooter />
    </>
  )
}
