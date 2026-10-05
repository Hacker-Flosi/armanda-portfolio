'use client'

import { useState } from 'react'
import Image from 'next/image'
import { InquiryForm } from '@/components/InquiryForm'
import {
  DEADLINES,
  EFFORTS,
  MOTIF_COUNTS,
  PROJECT_TYPES,
  USAGES,
  describeSelection,
  estimate,
  formatChf,
} from '@/lib/illustrationPricing'
import type { Option, Selection } from '@/lib/illustrationPricing'

type Step = { key: keyof Selection; question: string; options: Option[] }

const STEPS: Step[] = [
  { key: 'type', question: 'Wofür brauchst du die Illustration?', options: PROJECT_TYPES },
  { key: 'motifs', question: 'Wie viele Motive sollen es sein?', options: MOTIF_COUNTS },
  { key: 'effort', question: 'Wie aufwendig soll sie sein?', options: EFFORTS },
  { key: 'usage', question: 'Wo wird sie zu sehen sein?', options: USAGES },
  { key: 'deadline', question: 'Bis wann brauchst du sie?', options: DEADLINES },
]

// Interaktive Projekt-Zusammenstellung: fünf Fragen zum Antippen, danach eine
// grobe Richtspanne und zwei Wege zu Armanda (Anfrage oder Rückruf). Die Spanne
// ist nur eine Orientierung, kein Angebot.
export function ProjectConfigurator({
  images,
  mailAddress,
}: {
  // Illustration pro Antwort, Schlüssel "schritt:antwort" (z.B. "type:plakat").
  images: Record<string, string>
  mailAddress?: string
}) {
  const [selection, setSelection] = useState<Partial<Selection>>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [action, setAction] = useState<'projekt' | 'rueckruf' | null>(null)

  const done = stepIndex >= STEPS.length
  const range = done ? estimate(selection as Selection) : null
  const step = STEPS[stepIndex]

  function choose(option: Option) {
    setSelection((current) => ({ ...current, [step.key]: option.id }))
    window.setTimeout(() => setStepIndex((i) => i + 1), 220)
  }

  function restart() {
    setSelection({})
    setStepIndex(0)
    setAction(null)
  }

  const summary = done ? describeSelection(selection as Selection) : undefined
  const estimateText = range ? `${formatChf(range.min)} bis ${formatChf(range.max)}` : undefined

  return (
    <div className="border border-[var(--ink)]/20 p-5 sm:p-10 flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4 text-sm text-[var(--ink-muted)]">
        <span>{done ? 'Dein Projekt' : `Schritt ${stepIndex + 1} von ${STEPS.length}`}</span>
        {(stepIndex > 0 || done) && (
          <button
            type="button"
            onClick={() => (done ? setStepIndex(STEPS.length - 1) : setStepIndex((i) => i - 1))}
            className="underline underline-offset-4 cursor-pointer"
          >
            Zurück
          </button>
        )}
      </div>

      {!done && (
        <div className="flex gap-1.5" aria-hidden>
          {STEPS.map((s, i) => (
            <span key={s.key} className="h-[3px] flex-1 rounded-full" style={{ background: i <= stepIndex ? 'var(--ink)' : 'color-mix(in srgb, var(--ink) 20%, transparent)' }} />
          ))}
        </div>
      )}

      {!done ? (
        <div key={step.key} className="archive-tile flex flex-col gap-6">
          <h3 className="font-medium" style={{ fontSize: 'clamp(1.6rem, 1rem + 2.4vw, 3rem)', letterSpacing: '-0.03em', lineHeight: 1.02 }}>
            {step.question}
          </h3>
          <div className={`grid gap-3 sm:gap-4 ${step.options.length === 3 ? 'grid-cols-3' : step.options.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : step.options.length === 5 ? 'grid-cols-2 sm:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3'}`}>
            {step.options.map((option, i) => {
              const selected = selection[step.key] === option.id
              const src = images[`${step.key}:${option.id}`]
              const tilt = (i % 2 === 0 ? -1 : 1) * (1 + (i % 3) * 0.4)
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => choose(option)}
                  className="option-tile group text-left flex flex-col gap-2 cursor-pointer"
                  style={{ ['--tilt' as string]: `${tilt}deg`, animationDelay: `${i * 60}ms` }}
                >
                  <span
                    className="option-frame relative block w-full overflow-hidden bg-[var(--ink)]/[0.06] border transition-all duration-500"
                    style={{
                      aspectRatio: step.options.length > 4 || step.key === 'type' ? '1 / 1' : '4 / 5',
                      borderColor: selected ? 'var(--ink)' : 'transparent',
                      boxShadow: selected ? '0 0 0 3px var(--bg), 0 0 0 5px var(--ink)' : 'none',
                    }}
                  >
                    {src ? (
                      <Image src={src} alt="" fill sizes="(min-width: 640px) 25vw, 50vw" draggable={false} className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-[var(--ink-muted)]">Illustration folgt</span>
                    )}
                  </span>
                  <span className="flex flex-col gap-0.5 px-0.5">
                    <span className="font-medium">{option.label}</span>
                    {option.hint && <span className="text-sm text-[var(--ink-muted)]">{option.hint}</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="archive-tile flex flex-col gap-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_minmax(260px,5fr)] items-center">
          <div className="flex flex-col gap-3 order-2 lg:order-1">
            <span className="text-sm text-[var(--ink-muted)]">Dafür kannst du ungefähr mit</span>
            {range && (
              <span className="font-medium" style={{ fontSize: 'clamp(2rem, 1rem + 5vw, 5rem)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                {formatChf(range.min)} bis {formatChf(range.max)}
              </span>
            )}
            <span className="text-sm text-[var(--ink-muted)] max-w-lg">
              rechnen. Das ist eine grobe Orientierung und noch kein Angebot. Den genauen Preis besprechen wir, sobald ich dein Projekt kenne.
            </span>
          </div>
          {/* Deine Auswahl als Stapel von Drucken */}
          <div className="relative order-1 lg:order-2 h-[260px] sm:h-[340px] overflow-hidden" aria-hidden>
            {STEPS.map((st, i) => {
              const src = images[`${st.key}:${selection[st.key]}`]
              const n = STEPS.length
              const offset = i - (n - 1) / 2
              return (
                <span
                  key={st.key}
                  className="collage-print absolute top-1/2 left-1/2 w-[34%] aspect-[4/5] bg-[var(--bg)] p-1 shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
                  style={{
                    transform: `translate(calc(-50% + ${offset * 44}%), -50%) rotate(${offset * 5}deg)`,
                    zIndex: i,
                    animationDelay: `${i * 90}ms`,
                  }}
                >
                  <span className="relative block w-full h-full overflow-hidden bg-[var(--ink)]/[0.06]">
                    {src && <Image src={src} alt="" fill sizes="160px" className="object-cover" />}
                  </span>
                </span>
              )
            })}
          </div>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-5 gap-x-6 gap-y-3 text-sm">
            {summary &&
              Object.entries(summary).map(([label, value]) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-[var(--ink-muted)]">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setAction('projekt')}
              aria-pressed={action === 'projekt'}
              className="h-12 px-6 rounded-full font-medium cursor-pointer border transition-colors"
              style={{ background: action === 'projekt' ? 'var(--ink)' : 'transparent', color: action === 'projekt' ? 'var(--bg)' : 'var(--ink)', borderColor: 'var(--ink)' }}
            >
              Projekt an Armanda senden
            </button>
            <button
              type="button"
              onClick={() => setAction('rueckruf')}
              aria-pressed={action === 'rueckruf'}
              className="h-12 px-6 rounded-full font-medium cursor-pointer border transition-colors"
              style={{ background: action === 'rueckruf' ? 'var(--ink)' : 'transparent', color: action === 'rueckruf' ? 'var(--bg)' : 'var(--ink)', borderColor: 'var(--ink)' }}
            >
              Rückruf vereinbaren
            </button>
            <button type="button" onClick={restart} className="h-12 px-3 text-sm underline underline-offset-4 cursor-pointer text-[var(--ink-muted)]">
              Neu zusammenstellen
            </button>
          </div>

          {action && <InquiryForm key={action} kind={action} summary={summary} estimate={estimateText} mailFallback={mailAddress} />}
        </div>
      )}
    </div>
  )
}
