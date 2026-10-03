'use client'

import { useEffect, useRef, useState } from 'react'
import { IntroVideo } from '@/components/IntroVideo'
import { MaskRevealText } from '@/components/MaskRevealText'
import { ContactLink } from '@/components/ContactLink'

const DISPLAY_STYLE = { fontSize: 'clamp(1.6rem, 0.8rem + 3.4vw, 3.75rem)', letterSpacing: '-0.03em' }
const CONTACT_PHRASE = 'schreib mir einfach'

// Hero: Intro-Text und Video in Viewport-Höhe. Der Kontakt steckt als Textlink
// direkt im Satz (Phrase "schreib mir einfach"), die Typo ist also eins. Beim Laden öffnet sich das
// Video aus einem kleinen Ausschnitt (Clip + Zoom), der Text läuft Zeile für
// Zeile ein. Beim Scrollen schrumpft das Video leicht und rundet sich ab, der
// Text driftet nach oben und blendet aus, das Video selbst läuft per Parallax
// langsamer als sein Rahmen; der Hinweis "Projekte" verschwindet.
export function Hero({
  introText,
  videoSrc,
  fullVideoSrc,
  posterSrc,
  mailHref,
  mailAddress,
}: {
  introText?: string
  videoSrc?: string
  fullVideoSrc?: string
  posterSrc?: string
  mailHref?: string
  mailAddress?: string
}) {
  const [ready, setReady] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setReady(true)
      return
    }
    const id = window.setTimeout(() => setReady(true), 120)

    let frame = 0
    function update() {
      frame = 0
      const section = sectionRef.current
      if (!section) return
      const progress = Math.min(1, Math.max(0, window.scrollY / section.offsetHeight))
      if (textRef.current) {
        textRef.current.style.transform = `translateY(${-progress * 70}px)`
        textRef.current.style.opacity = String(1 - progress * 0.7)
      }
      if (videoRef.current) {
        videoRef.current.style.transform = `scale(${1 - progress * 0.06})`
        videoRef.current.style.borderRadius = `${progress * 6}px`
        videoRef.current.style.setProperty('--hero-par', `${progress * 70}px`)
        // Die Video-Icons folgen dem sichtbaren Teil der Maske: sie bleiben unter
        // dem Header im Bild, solange das Video noch zu sehen ist.
        const frame = videoRef.current.getBoundingClientRect()
        const shift = Math.max(0, Math.min(frame.height - 72, 40 - frame.top))
        videoRef.current.style.setProperty('--icon-shift', `${shift}px`)
      }
      if (cueRef.current) cueRef.current.style.opacity = String(Math.max(0, 1 - progress * 4))
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  function scrollToProjects() {
    const section = sectionRef.current
    if (section) window.scrollTo({ top: section.offsetTop + section.offsetHeight, behavior: 'smooth' })
  }

  return (
    <section ref={sectionRef} className="flex flex-col" style={{ minHeight: 'calc(100dvh - 4.5rem)' }}>
      <div ref={textRef} className="shrink-0 px-4 pt-10 pb-6 flex flex-col gap-2 will-change-transform">
        {introText && (
          <MaskRevealText
            text={introText}
            inlineLinks={mailHref && introText.includes(CONTACT_PHRASE) ? [{ phrase: CONTACT_PHRASE, href: mailHref }] : undefined}
            indent="var(--text-indent)"
            lineHeight={0.98}
            className="font-medium"
            style={DISPLAY_STYLE}
          />
        )}
        {mailHref && !introText?.includes(CONTACT_PHRASE) && (
          <div
            style={{
              ...DISPLAY_STYLE,
              paddingLeft: 'var(--text-indent)',
              opacity: ready ? 1 : 0,
              transform: ready ? 'none' : 'translateY(24px)',
              transition: 'opacity 1s ease 0.8s, transform 1.2s cubic-bezier(0.16, 1, 0.3, 1) 0.8s',
            }}
          >
            <ContactLink href={mailHref} label="Oder schreib mir direkt" hoverLabel={mailAddress ?? 'mail@armanda-asani.ch'} />
          </div>
        )}
      </div>

      {(videoSrc || fullVideoSrc) && (
        <div className="relative flex-1 min-h-[50dvh]">
          <div
            ref={videoRef}
            className="absolute inset-0 overflow-hidden will-change-transform"
            style={{ transformOrigin: 'center top' }}
          >
            <div
              className="h-full"
              style={{
                clipPath: ready ? 'inset(0% 0% 0% 0% round 0px)' : 'inset(16% 14% 16% 14% round 6px)',
                transform: ready ? 'scale(1)' : 'scale(1.14)',
                transition:
                  'clip-path 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s, transform 2s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
              }}
            >
              <IntroVideo src={videoSrc} fullSrc={fullVideoSrc} poster={posterSrc} fill />
            </div>
          </div>

          <div ref={cueRef} className="absolute left-4 bottom-4 z-10">
            <button
              type="button"
              onClick={scrollToProjects}
              className="inline-flex items-center gap-3 h-10 pl-4 pr-3 rounded-full bg-[var(--bg)] text-[var(--ink)] text-sm font-medium cursor-pointer"
              style={{ opacity: ready ? 1 : 0, transition: 'opacity 1s ease 1.2s' }}
            >
              Projekte
              <span className="hero-cue-arrow flex items-center justify-center w-6 h-6 rounded-full bg-[var(--ink)] text-[var(--bg)]" aria-hidden>
                ↓
              </span>
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
