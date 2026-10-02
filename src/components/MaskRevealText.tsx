'use client'

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

// Sichere interne Zeilenhöhe für die Mask-Box selbst — muss grösser sein als
// die tatsächliche Glyphenhöhe (Auf-/Abstriche), sonst schneidet das
// overflow-hidden der einzelnen Zeile die Schrift an. Die gewünschte engere
// optische Zeilendistanz wird separat über einen negativen margin-top
// zwischen den Zeilen erzeugt, der die Boxen überlappen lässt, ohne ihren
// eigenen Inhalt zu beschneiden.
const SAFE_BOX_LINE_HEIGHT = 1.15

export type InlineLink = { phrase: string; href: string }

// Typografische Bindungen, damit keine einzelnen Wörter oder Gedankenstriche
// am Zeilenanfang/-ende hängen bleiben: Gedankenstrich klebt am Vorwort,
// sehr kurze Wörter (<= 2 Zeichen) am Folgewort, die letzten zwei Wörter
// bleiben zusammen (keine Einzelwort-Schlusszeile).
function bindWords(text: string, links: InlineLink[] = []): string[] {
  let source = text
  for (const link of links) source = source.replace(link.phrase, `${link.phrase.replace(/ /g, '\u00A0')}→`)
  const words = source.replace(/ ([—–-]) /g, '\u00A0$1 ').split(' ')
  const merged: string[] = []
  for (let i = 0; i < words.length; i++) {
    let word = words[i]
    while (i < words.length - 1 && word.replace(/[^\p{L}]/gu, '').length <= 2) {
      i += 1
      word = `${word}\u00A0${words[i]}`
    }
    merged.push(word)
  }
  if (merged.length > 2) {
    const last = merged.pop() as string
    merged[merged.length - 1] = `${merged[merged.length - 1]}\u00A0${last}`
  }
  return merged
}

// Line-by-Line Mask Reveal: zerlegt den Text zur Laufzeit in seine
// tatsächlich gerenderten Zeilen (abhängig von Breite/Schriftgrösse), legt
// jede Zeile in einen eigenen overflow-hidden-Rahmen und lässt sie einzeln,
// zeitlich leicht versetzt, von unten einblenden, sobald die Sektion in den
// Viewport scrollt — inspiriert von gilhuybrecht.com/profile/. `indent`
// schiebt nur die erste Zeile nach rechts (Pendant zu CSS text-indent),
// alle Folgezeilen laufen über die volle Breite. `lineHeight` ist die
// gewünschte optische Zeilendistanz in em (Default 1 = normal).
export function MaskRevealText({
  text,
  indent,
  lineHeight = 1,
  inlineLinks,
  style,
  className,
}: {
  text: string
  indent?: string
  lineHeight?: number
  inlineLinks?: InlineLink[]
  style?: CSSProperties
  className?: string
}) {
  const measureRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<string[] | null>(null)
  const [revealed, setRevealed] = useState(false)
  const reducedMotion = useRef(false)

  useLayoutEffect(() => {
    function measure() {
      const el = measureRef.current
      if (!el) return
      const wordSpans = Array.from(el.querySelectorAll('[data-word]')) as HTMLSpanElement[]
      const groups: string[][] = []
      let lastTop: number | null = null
      wordSpans.forEach((span) => {
        const top = span.offsetTop
        if (lastTop === null || Math.abs(top - lastTop) > 2) {
          groups.push([(span.textContent ?? '').trim()])
          lastTop = top
        } else {
          groups[groups.length - 1].push((span.textContent ?? '').trim())
        }
      })
      setLines(groups.map((g) => g.join(' ')))
    }

    measure()
    document.fonts?.ready?.then(measure)

    const el = measureRef.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [text, indent])

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const el = containerRef.current
    if (!el || !lines) return
    if (reducedMotion.current) {
      setRevealed(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [lines])

  // Inline-Links: die Wortgruppe wird in der Zeile als Textlink in derselben
  // Typografie gerendert (Unterstreichung wird beim Hover dicker, Pfeil dreht).
  function renderLine(line: string) {
    for (const link of inlineLinks ?? []) {
      const bound = link.phrase.replace(/ /g, '\u00A0')
      const at = line.indexOf(bound)
      if (at === -1) continue
      return (
        <>
          {line.slice(0, at)}
          <a
            href={link.href}
            className="group relative inline-block whitespace-nowrap underline decoration-[0.05em] underline-offset-[0.14em] hover:decoration-[0.12em] transition-[text-decoration-thickness] duration-300"
          >
            {link.phrase}
            <span aria-hidden className="inline-block ml-[0.15em] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[-45deg]">
              →
            </span>
          </a>
          {line.slice(at + bound.length + (line[at + bound.length] === '→' ? 1 : 0))}
        </>
      )
    }
    return line
  }

  const overlapMargin = `${lineHeight - SAFE_BOX_LINE_HEIGHT}em`

  return (
    <div ref={containerRef} className={className} style={{ ...style, position: 'relative', overflow: 'clip', lineHeight: `${SAFE_BOX_LINE_HEIGHT}em` }}>
      <div
        ref={measureRef}
        aria-hidden
        style={{
          position: 'absolute',
          visibility: 'hidden',
          top: 0,
          left: 0,
          right: 0,
          textIndent: indent,
          paddingRight: '0.25em',
          textWrap: text.length < 220 ? 'balance' : 'pretty',
        }}
      >
        {bindWords(text, inlineLinks).map((word, i) => (
          <Fragment key={i}>
            <span data-word style={{ display: 'inline-block' }}>
              {word}
            </span>{' '}
          </Fragment>
        ))}
      </div>

      {lines ? (
        lines.map((line, i) => (
          <div key={i} style={{ overflow: 'hidden', marginTop: i === 0 ? 0 : overlapMargin }}>
            <div
              data-reveal-line
              style={{
                whiteSpace: 'nowrap',
                textIndent: i === 0 ? indent : undefined,
                transform: revealed ? 'translateY(0%)' : 'translateY(115%)',
                opacity: revealed ? 1 : 0,
                transition: reducedMotion.current
                  ? 'none'
                  : `transform 0.75s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.06}s, opacity 0.6s ease ${i * 0.06}s`,
              }}
            >
              {renderLine(line)}
            </div>
          </div>
        ))
      ) : (
        <div style={{ opacity: 0, textIndent: indent }}>{text}</div>
      )}
    </div>
  )
}
