import type { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { IllustrationGate } from '@/components/IllustrationGate'
import { ACCESS_COOKIE, tokenValid } from '@/lib/illustrationAccess'
import { SiteFooter } from '@/components/SiteFooter'
import { Reveal } from '@/components/Reveal'
import { MaskRevealText } from '@/components/MaskRevealText'
import { ProcessStory } from '@/components/ProcessStory'
import { IllustrationHero } from '@/components/IllustrationHero'
import { HandworkScrubber } from '@/components/HandworkScrubber'
import type { HandworkStage } from '@/components/HandworkScrubber'
import { ProjectHeader } from '@/components/ProjectHeader'
import { ProjectMedia } from '@/components/ProjectMedia'
import { StackSection } from '@/components/StackSection'
import { ThemeExplorer } from '@/components/ThemeExplorer'
import type { Topic } from '@/components/ThemeExplorer'
import { playToTiles, worksToTiles } from '@/lib/designMedia'
import type { MediaTile } from '@/lib/designMedia'
import { ProjectConfigurator } from '@/components/ProjectConfigurator'
import { InquiryForm } from '@/components/InquiryForm'
import { getDesignPlay, getDesignWorks, getIllustrationPage, getSiteSettings } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { DEFAULT_CONTENT } from '@/lib/illustrationDefaults'
import { DEADLINES, EFFORTS, MOTIF_COUNTS, PROJECT_TYPES, USAGES } from '@/lib/illustrationPricing'

export const revalidate = 60

// Konzeptphase: die Seite ist bewusst nicht für Suchmaschinen gedacht und nur
// über den Link im Impressum erreichbar.
export const metadata: Metadata = {
  title: 'Illustration beauftragen — Armanda Asani',
  description: 'Handgezeichnete Illustration in eigenem Stil, ohne KI. Stell dein Projekt zusammen und erfahre, womit du rechnen kannst.',
  robots: { index: false, follow: false },
}

const DISPLAY = { fontSize: 'clamp(1.8rem, 0.9rem + 3.6vw, 4rem)', letterSpacing: '-0.03em' }

function pick<T>(cms: T[] | undefined | null, fallback: T[]): T[] {
  return cms && cms.length > 0 ? cms : fallback
}

function SectionHead({ index, title }: { index: string; title: string }) {
  return (
    <Reveal className="reveal-soft flex items-baseline gap-4">
      <span className="text-xs text-[var(--ink-muted)]">{index}</span>
      <h2 className="text-sm font-medium uppercase tracking-wide">{title}</h2>
    </Reveal>
  )
}

async function IllustrationContent() {
  const [page, works, settings, play] = await Promise.all([getIllustrationPage(), getDesignWorks(), getSiteSettings(), getDesignPlay()])

  const heroTitle = page?.heroTitle || DEFAULT_CONTENT.heroTitle
  const heroText = page?.heroText || DEFAULT_CONTENT.heroText
  const handworkTitle = page?.handworkTitle || DEFAULT_CONTENT.handworkTitle
  const handworkText = page?.handworkText || DEFAULT_CONTENT.handworkText
  const handworkSteps = pick(page?.handworkSteps, DEFAULT_CONTENT.handworkSteps.map((s, i) => ({ _key: String(i), ...s })))
  const benefits = pick(page?.benefits, DEFAULT_CONTENT.benefits.map((b, i) => ({ _key: String(i), ...b })))
  const process = pick(page?.process, DEFAULT_CONTENT.process.map((p, i) => ({ _key: String(i), ...p })))
  const faq = pick(page?.faq, DEFAULT_CONTENT.faq.map((f, i) => ({ _key: String(i), ...f })))
  const testimonials = page?.testimonials ?? []

  const worksWithImage = works.filter((w) => w.images?.some((m) => m.image))

  // Fallstudien: aus dem CMS, sonst die ersten Grafik-Projekte als Vorschau
  // (Aufgabe → Thema, Vorgehen → Idee, Ergebnis → Wirkung).
  const toTile = (key: string, image: Parameters<typeof urlFor>[0], title: string, ratio?: number | null): MediaTile => ({
    key,
    kind: 'image',
    label: title,
    aspectRatio: ratio ?? null,
    src: urlFor(image).width(1200).fit('max').auto('format').url(),
    fullSrc: urlFor(image).width(2800).fit('max').auto('format').url(),
  })
  const cases =
    page?.cases && page.cases.length > 0
      ? page.cases.map((c) => ({
          key: c._key,
          title: c.title ?? '',
          client: c.client,
          tags: c.tags ?? [],
          topic: c.topic,
          idea: c.idea,
          outcome: c.outcome,
          tiles: (c.images ?? []).map((img) => toTile(img._key, img.image, c.title ?? '', img.aspectRatio)),
        }))
      : worksWithImage.slice(0, 3).map((w) => ({
          key: w._id,
          title: w.title,
          client: w.client,
          tags: w.tags ?? [],
          topic: w.challenge ?? w.description,
          idea: w.approach,
          outcome: w.result,
          tiles: worksToTiles([w]),
        }))
  const casesIntro = page?.casesIntro || DEFAULT_CONTENT.casesIntro

  // Archiv zum Entdecken: Themen = Tags der Grafik-Arbeiten (im Studio pflegbar).
  const allTiles = [...worksToTiles(works), ...playToTiles(play)]
  const tagNames = Array.from(new Set(works.flatMap((w) => w.tags ?? [])))
  const topics: Topic[] = [
    ...tagNames
      .map((name) => {
        const tiles = worksToTiles(works.filter((w) => w.tags?.includes(name)))
        return { name, count: tiles.length, previews: tiles.filter((t) => t.kind === 'image').slice(0, 4).map((t) => t.src), tiles }
      })
      .filter((topic) => topic.count > 0)
      .sort((a, b) => b.count - a.count),
    {
      name: 'Alles ansehen',
      count: allTiles.length,
      previews: allTiles.filter((t) => t.kind === 'image').slice(0, 4).map((t) => t.src),
      tiles: allTiles,
    },
  ].filter((topic) => topic.previews.length > 0)

  // Handwerk-Bühne: eigene Bilder aus dem CMS (ein Bild pro Schritt). Fehlen
  // sie, zeigt die Vorschau dasselbe Beispielbild in drei Stufen
  // (Skizze → Entwurf → Illustration), damit die Interaktion sichtbar ist.
  const stepsWithImages = handworkSteps.filter((step) => step.image)
  const stageFilters = ['grayscale(1) contrast(1.5) brightness(1.2)', 'grayscale(0.6) contrast(1.15)', undefined]
  const fallbackWork = worksWithImage[0]
  const handworkStages: HandworkStage[] =
    stepsWithImages.length >= 2 && stepsWithImages.length === handworkSteps.length
      ? handworkSteps.map((step) => ({
          title: step.title ?? '',
          text: step.text,
          src: urlFor(step.image!).width(1600).fit('max').auto('format').url(),
        }))
      : fallbackWork
        ? handworkSteps.map((step, i) => ({
            title: step.title ?? '',
            text: step.text,
            src: urlFor(fallbackWork.images.find((m) => m.image)!.image!).width(1600).fit('max').auto('format').url(),
            filter: stageFilters[Math.min(i, stageFilters.length - 1)],
          }))
        : []

  // Drucke im Einstieg (zum Herumschieben): die ersten Projektbilder.
  const heroPrints = worksWithImage.slice(0, 5).map((w) => ({
    src: urlFor(w.images.find((m) => m.image)!.image!).width(500).fit('max').auto('format').url(),
    alt: w.title,
  }))

  // Illustrationen für den Konfigurator: von Armanda aus dem CMS, sonst
  // vorläufig Projektbilder als Platzhalter (reihum).
  const placeholderPool = worksWithImage.flatMap((w) =>
    w.images.filter((m) => m.image).slice(0, 2).map((m) => urlFor(m.image!).width(700).fit('crop').auto('format').url())
  )
  const configImages: Record<string, string> = {}
  const optionKeys = [
    ...PROJECT_TYPES.map((o) => `type:${o.id}`),
    ...MOTIF_COUNTS.map((o) => `motifs:${o.id}`),
    ...EFFORTS.map((o) => `effort:${o.id}`),
    ...USAGES.map((o) => `usage:${o.id}`),
    ...DEADLINES.map((o) => `deadline:${o.id}`),
  ]
  optionKeys.forEach((key, i) => {
    if (placeholderPool.length > 0) configImages[key] = placeholderPool[i % placeholderPool.length]
  })
  for (const entry of page?.configImages ?? []) {
    if (entry.option && entry.image) configImages[entry.option] = urlFor(entry.image).width(700).fit('crop').auto('format').url()
  }

  return (
    <>
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-[var(--bar-bg)] text-[var(--bar-fg)] px-4 h-9 text-base shrink-0 whitespace-nowrap">
        <Link href="/design" className="font-medium">
          Armanda Asani
        </Link>
        <a href="#konfigurator">Projekt zusammenstellen</a>
      </header>

      <main className="flex-1 bg-[var(--bg)] text-[var(--ink)]">
        {/* 1 — Einstieg */}
        <IllustrationHero title={heroTitle} text={heroText} prints={heroPrints} />

        {/* 2 — Handwerk */}
        <section className="border-t border-[var(--line)] px-4 pt-6 pb-24 flex flex-col gap-10">
          <SectionHead index="01" title="Handwerk" />
          <div className="flex flex-col gap-8 max-w-5xl">
            <MaskRevealText text={handworkTitle} lineHeight={0.98} className="font-medium" style={DISPLAY} />
            <p className="max-w-2xl text-lg leading-snug">{handworkText}</p>
          </div>
          <HandworkScrubber stages={handworkStages} />
          <div className="grid gap-px sm:grid-cols-3 border-t border-[var(--ink)]/25 pt-0">
            {benefits.map((benefit, i) => (
              <Reveal key={benefit._key} className="reveal-soft">
                <div className="usp-card group relative h-full flex flex-col gap-5 py-8 sm:py-10 sm:px-6 sm:first:pl-0 sm:border-l sm:first:border-l-0 border-[var(--ink)]/25">
                  <span className="relative inline-flex items-center gap-4">
                    <span
                      className="usp-figure font-medium leading-none inline-block origin-left"
                      style={{ fontSize: 'clamp(3.4rem, 1.5rem + 7vw, 8rem)', letterSpacing: '-0.05em' }}
                    >
                      {benefit.figure ?? String(i + 1)}
                    </span>
                  </span>
                  <span className="usp-line h-[3px] w-12 origin-left" style={{ background: 'var(--ink)' }} aria-hidden />
                  <span className="text-xl font-medium" style={{ letterSpacing: '-0.02em' }}>
                    {benefit.title}
                  </span>
                  <span className="text-[var(--ink-muted)]">{benefit.text}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* 3 — Fallstudien */}
        <section className="border-t border-[var(--line)] px-4 pt-6 pb-24 flex flex-col gap-12">
          <SectionHead index="02" title="Fallstudien" />
          <div className="flex flex-col gap-6 max-w-5xl">
            <MaskRevealText text="Wenn ein Foto nicht reicht." lineHeight={0.98} className="font-medium" style={DISPLAY} />
            <p className="max-w-2xl text-lg leading-snug">{casesIntro}</p>
          </div>

          {/* Gestapelte Projekte wie auf der Grafikseite (volle Breite) */}
          <div className="-mx-4">
            {cases.map((c, i) => (
              <StackSection key={c.key} index={i} className="border-t border-[var(--line)]">
                <Reveal className="reveal-soft shrink-0">
                  <ProjectHeader
                    title={c.title}
                    tags={c.tags}
                    client={c.client}
                    challenge={c.topic}
                    approach={c.idea}
                    result={c.outcome}
                    labels={{ challenge: 'Das Thema', approach: 'Die Idee', result: 'Was daraus wurde' }}
                  />
                </Reveal>
                <Reveal className="reveal-soft flex-1 min-h-0">
                  <ProjectMedia title={c.title} lane={c.tags.join(' · ') || 'Fallstudie'} note={c.topic} tiles={c.tiles} />
                </Reveal>
              </StackSection>
            ))}
          </div>

          {topics.length > 0 && (
            <div className="flex flex-col gap-8 pt-8">
              <div className="flex flex-col gap-3 max-w-3xl">
                <span className="text-xs uppercase tracking-wide text-[var(--ink-muted)]">Mehr entdecken</span>
                <MaskRevealText text="Such dir ein Thema aus und sieh, wie ich es bebildere." lineHeight={0.98} className="font-medium" style={DISPLAY} />
              </div>
              <ThemeExplorer topics={topics} />
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 pt-4">
            {testimonials.length > 0 ? (
              testimonials.map((t) => (
                <Reveal key={t._key} className="reveal-soft flex flex-col gap-3 border-t border-[var(--ink)]/30 pt-5">
                  <p className="text-xl leading-snug" style={{ textWrap: 'pretty' }}>
                    «{t.quote}»
                  </p>
                  <span className="text-sm text-[var(--ink-muted)]">{[t.name, t.role].filter(Boolean).join(', ')}</span>
                </Reveal>
              ))
            ) : (
              <div className="border border-dashed border-[var(--ink)]/30 p-6 text-sm text-[var(--ink-muted)]">
                Platzhalter: Hier erscheinen Kundenstimmen, sobald sie im Studio unter «Illustration — Seite» eingetragen sind (Tsüri.ch und weitere).
              </div>
            )}
          </div>
        </section>

        {/* 4 — Konfigurator */}
        <section id="konfigurator" className="scroll-mt-12 border-t border-[var(--line)] px-4 pt-6 pb-24 flex flex-col gap-10">
          <SectionHead index="03" title="Dein Projekt" />
          <MaskRevealText text="Stell dein Projekt zusammen und sieh, womit du rechnen kannst." lineHeight={0.98} className="font-medium max-w-5xl" style={DISPLAY} />
          <ProjectConfigurator images={configImages} mailAddress={settings?.mailAddress} />
        </section>

        {/* 5 — Ablauf */}
        <section className="border-t border-[var(--line)] px-4 pt-6 pb-24 flex flex-col gap-10">
          <SectionHead index="04" title="So läuft es ab" />
          <ProcessStory
            steps={process.map((step) => ({
              key: step._key,
              title: step.title ?? '',
              text: step.text,
              duration: step.duration,
              imageSrc: 'imageUrl' in step ? (step.imageUrl as string | undefined) : undefined,
              videoSrc: 'videoUrl' in step ? (step.videoUrl as string | undefined) : undefined,
            }))}
          />
        </section>

        {/* 6 — Fragen */}
        <section className="border-t border-[var(--line)] px-4 pt-6 pb-24 flex flex-col gap-10">
          <SectionHead index="05" title="Fragen" />
          <div className="max-w-3xl flex flex-col">
            {faq.map((item) => (
              <details key={item._key} className="group border-t border-[var(--line)] last:border-b py-5">
                <summary className="flex items-start justify-between gap-6 cursor-pointer list-none text-lg font-medium [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span aria-hidden className="shrink-0 transition-transform duration-300 group-open:rotate-45">+</span>
                </summary>
                <p className="pt-3 max-w-2xl text-[var(--ink-muted)]">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 7 — Rückruf */}
        <section id="rueckruf" className="scroll-mt-12 border-t border-[var(--line)] px-4 pt-6 pb-28 flex flex-col gap-8">
          <SectionHead index="06" title="Rückruf" />
          <MaskRevealText text="Lieber persönlich? Ich rufe dich zurück." lineHeight={0.98} className="font-medium max-w-5xl" style={DISPLAY} />
          <InquiryForm kind="rueckruf" mailFallback={settings?.mailAddress} />
        </section>
      </main>

      <SiteFooter hidePrints />
    </>
  )
}

// Konzeptphase: Inhalt (und alle Daten dazu) nur mit gültigem Zugangs-Cookie;
// sonst nur die Passwortabfrage.
export default async function IllustrationPage() {
  const store = await cookies()
  if (!tokenValid(store.get(ACCESS_COOKIE)?.value)) {
    return (
      <>
        <header className="sticky top-0 z-20 flex items-center justify-between bg-[var(--bar-bg)] text-[var(--bar-fg)] px-4 h-9 text-base shrink-0">
          <Link href="/design" className="font-medium">
            Armanda Asani
          </Link>
        </header>
        <IllustrationGate />
        <SiteFooter hidePrints />
      </>
    )
  }
  return <IllustrationContent />
}
