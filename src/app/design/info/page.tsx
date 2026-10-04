import type { Metadata } from 'next'
import { ResolveFanTransition } from '@/components/ResolveFanTransition'
import { DesignHeader } from '@/components/DesignHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { Reveal } from '@/components/Reveal'
import { MaskRevealText } from '@/components/MaskRevealText'
import { InfoNav } from '@/components/InfoNav'
import { AbseitsModule } from '@/components/AbseitsModule'
import { ArtSectionPreview } from '@/components/ArtSectionPreview'
import { ContactLink } from '@/components/ContactLink'
import { ContactSection } from '@/components/ContactSection'
import { getArtworks, getDesignAbout, getDesignInterests, getSiteSettings } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { getSpotifyMeta } from '@/lib/spotifyOembed'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Info — Armanda Asani, Grafikdesign',
  description: 'Wer ich bin, wie ich arbeite, was mir an meinem Beruf gefällt und was ich suche.',
}

const DISPLAY = { fontSize: 'clamp(1.6rem, 0.8rem + 3.4vw, 3.5rem)', letterSpacing: '-0.03em' }
const LINE_HEIGHT = 0.98
const CONTACT_PHRASE = 'schreib mir einfach'

function paragraphsOf(text?: string): string[] {
  if (!text) return []
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function Section({ id, index, title, children }: { id: string; index: number; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-[var(--line)] pt-5 pb-20 flex flex-col gap-8">
      <Reveal className="reveal-soft flex items-baseline gap-4">
        <span className="text-xs text-[var(--ink-muted)]">{String(index).padStart(2, '0')}</span>
        <h2 className="text-sm font-medium uppercase tracking-wide">{title}</h2>
      </Reveal>
      {children}
    </section>
  )
}

function Text({ paragraphs, links }: { paragraphs: string[]; links?: { phrase: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      {paragraphs.map((paragraph, i) => (
        <MaskRevealText
          key={i}
          text={paragraph}
          indent={i === 0 ? 'var(--text-indent)' : undefined}
          lineHeight={LINE_HEIGHT}
          inlineLinks={links?.filter((link) => paragraph.includes(link.phrase))}
          className="font-medium"
          style={DISPLAY}
        />
      ))}
    </div>
  )
}

function Tags({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <Reveal className="reveal-soft flex flex-col gap-2">
      <span className="text-sm text-[var(--ink-muted)]">{title}</span>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item} className="h-8 px-3.5 inline-flex items-center rounded-full border border-[var(--ink)]/25 text-sm">
            {item}
          </li>
        ))}
      </ul>
    </Reveal>
  )
}

export default async function DesignInfoPage() {
  const [about, interests, settings, artworks] = await Promise.all([
    getDesignAbout(),
    getDesignInterests(),
    getSiteSettings(),
    getArtworks(),
  ])
  const artPreview = artworks.slice(0, 4).flatMap((artwork) => {
    const cover = artwork.images?.find((entry) => entry.isMobileCover) ?? artwork.images?.[0]
    if (!cover) return []
    return [
      {
        key: artwork._id,
        title: artwork.title,
        aspectRatio: cover.aspectRatio,
        src: urlFor(cover.image).width(700).fit('max').auto('format').url(),
      },
    ]
  })
  const artText =
    about?.artText ??
    'Neben dem Grafikdesign male ich. Dort liegt mein Ursprung — Farbe, Fläche und Spannung, die auch in meine Gestaltung einfliessen.'
  const mailHref = settings?.mailAddress
    ? `mailto:${settings.mailAddress}${settings.mailSubject ? `?subject=${encodeURIComponent(settings.mailSubject)}` : ''}`
    : undefined

  const photos = interests
    .filter((item) => item.kind === 'foto' && item.image)
    .map((item) => ({
      key: item._id,
      title: item.title ?? 'Privat',
      note: item.note,
      src: urlFor(item.image!).width(1000).fit('max').auto('format').url(),
      fullSrc: urlFor(item.image!).width(2400).fit('max').auto('format').url(),
      aspectRatio: item.aspectRatio,
    }))
  const recordDocs = interests.filter((item) => item.kind === 'platte' && (item.image || item.spotifyUrl))
  const spotifyMeta = await Promise.all(recordDocs.map((item) => (item.image && item.title && item.artist ? null : getSpotifyMeta(item.spotifyUrl))))
  const records = recordDocs.flatMap((item, i) => {
    const meta = spotifyMeta[i]
    const src = item.image
      ? urlFor(item.image).width(700).height(700).fit('crop').auto('format').url()
      : meta?.cover
    if (!src) return []
    return [
      {
        key: item._id,
        title: item.title || meta?.title || 'Platte',
        artist: item.artist || meta?.artist,
        year: item.year,
        note: item.note,
        spotifyUrl: item.spotifyUrl,
        src,
      },
    ]
  })
  const playlistUrl = about?.spotifyPlaylistUrl

  const sections = [
    { id: 'profil', label: 'Profil', show: Boolean(about?.bio) },
    { id: 'arbeiten', label: 'So arbeite ich', show: Boolean(about?.approach) },
    { id: 'beruf', label: 'Was mir gefällt', show: Boolean(about?.loves) },
    { id: 'suche', label: 'Was ich suche', show: Boolean(about?.looking) },
    { id: 'kunst', label: 'Meine Kunst', show: true },
    { id: 'privat', label: 'Abseits der Arbeit', show: photos.length + records.length > 0 || Boolean(playlistUrl) },
  ].filter((section) => section.show)
  const number = (id: string) => sections.findIndex((section) => section.id === id) + 1

  const links = mailHref ? [{ phrase: CONTACT_PHRASE, href: mailHref }] : undefined

  return (
    <>
      <ResolveFanTransition />
      <DesignHeader />
      <main className="flex-1 bg-[var(--bg)] text-[var(--ink)]">
        <div className="px-4 pt-12 md:grid md:grid-cols-[190px_minmax(0,1fr)] md:gap-12">
          <InfoNav items={sections.map(({ id, label }) => ({ id, label }))} />

          <div className="min-w-0">
            {about?.bio && (
              <Section id="profil" index={number('profil')} title="Profil">
                <Text paragraphs={paragraphsOf(about.bio)} />
                <div className="flex flex-col gap-5">
                  <Tags title="Das biete ich" items={about.services} />
                  <Tags title="Da arbeite ich gern" items={about.industries} />
                </div>
              </Section>
            )}

            {about?.approach && (
              <Section id="arbeiten" index={number('arbeiten')} title="So arbeite ich">
                <Text paragraphs={paragraphsOf(about.approach)} />
                {about.process && about.process.length > 0 && (
                  <ol className="grid gap-px bg-[var(--line)] sm:grid-cols-2 xl:grid-cols-4 max-w-5xl">
                    {about.process.map((step, i) => (
                      <li key={i} className="group bg-[var(--bg)] p-5 flex flex-col gap-3 transition-colors duration-500 hover:bg-[var(--ink)] hover:text-[var(--bg)]">
                        <span className="text-xs opacity-60">{String(i + 1).padStart(2, '0')}</span>
                        <span className="font-medium text-xl" style={{ letterSpacing: '-0.02em' }}>
                          {step.title}
                        </span>
                        {step.text && <p className="text-sm opacity-70">{step.text}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </Section>
            )}

            {about?.loves && (
              <Section id="beruf" index={number('beruf')} title="Was mir gefällt">
                <Text paragraphs={paragraphsOf(about.loves)} />
              </Section>
            )}

            {about?.looking && (
              <Section id="suche" index={number('suche')} title="Was ich suche">
                <Text paragraphs={paragraphsOf(about.looking)} links={links} />
                {(settings?.availability ?? 'Verfügbar Oktober 26') && (
                  <Reveal className="reveal-soft inline-flex items-center gap-3 self-start h-9 px-4 rounded-full border border-[var(--ink)]/30 text-sm">
                    <span className="w-2 h-2 rounded-full bg-[#4fd37a] hero-cue-arrow" aria-hidden />
                    {settings?.availability ?? 'Verfügbar Oktober 26'}
                  </Reveal>
                )}
              </Section>
            )}

            <Section id="kunst" index={number('kunst')} title="Meine Kunst">
              <Text paragraphs={paragraphsOf(artText)} />
              <ArtSectionPreview works={artPreview} />
              <div style={DISPLAY}>
                <ContactLink href="/" label="Zur Kunst" hoverLabel="Meine Malerei ansehen" />
              </div>
            </Section>
          </div>
        </div>

        {(photos.length + records.length > 0 || playlistUrl) && (
          <section id="privat" className="scroll-mt-28 border-t border-[var(--line)] pt-5 pb-24 flex flex-col gap-8">
            <Reveal className="reveal-soft flex items-baseline gap-4 px-4">
              <span className="text-xs text-[var(--ink-muted)]">{String(number('privat')).padStart(2, '0')}</span>
              <h2 className="text-sm font-medium uppercase tracking-wide">Abseits der Arbeit</h2>
            </Reveal>
            <div className="px-4">
              <MaskRevealText
                text="Das bin auch ich — Fotos von dem, was mir wichtig ist, und die Platten, die bei mir laufen."
                indent="var(--text-indent)"
                lineHeight={LINE_HEIGHT}
                className="font-medium"
                style={DISPLAY}
              />
            </div>
            <div className="px-4">
              <AbseitsModule photos={photos} records={records} playlistUrl={playlistUrl} />
            </div>
          </section>
        )}

        <ContactSection mailHref={mailHref} mailAddress={settings?.mailAddress} hasCv={Boolean(settings?.cvUrl)} />
      </main>
      <SiteFooter hidePrints />
    </>
  )
}
