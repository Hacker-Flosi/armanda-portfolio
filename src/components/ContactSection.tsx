import { MaskRevealText } from '@/components/MaskRevealText'
import { ContactLink } from '@/components/ContactLink'
import { CvContactLink } from '@/components/CvGate'
import { Reveal } from '@/components/Reveal'

const DISPLAY_STYLE = { fontSize: 'clamp(2rem, 1rem + 5vw, 6rem)', letterSpacing: '-0.03em' }

// Abschluss der Seite in derselben Display-Typografie wie die Hero: erst die
// Frage, dann Kontakt und CV als grosse Textlinks statt Buttons.
export function ContactSection({
  mailHref,
  mailAddress,
  hasCv,
}: {
  mailHref?: string
  mailAddress?: string
  hasCv?: boolean
}) {
  if (!mailHref) return null

  return (
    <section className="border-t border-[var(--line)] px-4 pt-20 pb-24 flex flex-col gap-4">
      <MaskRevealText
        text="Gefällt dir, was du siehst? Dann lass uns reden."
        indent="var(--text-indent)"
        lineHeight={0.98}
        className="font-medium"
        style={DISPLAY_STYLE}
      />
      <Reveal className="reveal-soft flex flex-col gap-1" style={{ ...DISPLAY_STYLE, paddingLeft: 'var(--text-indent)' }}>
        <ContactLink href={mailHref} label="Schreib mir" hoverLabel={mailAddress ?? 'mail@armanda-asani.ch'} />
        {hasCv && <CvContactLink />}
      </Reveal>
    </section>
  )
}
