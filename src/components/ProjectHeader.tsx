'use client'

import { useState } from 'react'

// Projekt-Kopf: Titel, beliebig viele Kategorie-Tags und Kunde oben links; ein Plus
// klappt weitere Infos (Jahr, Projektbeschrieb) sanft auf.
export function ProjectHeader({
  title,
  tags,
  client,
  year,
  description,
  challenge,
  approach,
  result,
  role,
  labels,
}: {
  title: string
  tags: string[]
  client?: string
  year?: string
  description?: string
  challenge?: string
  approach?: string
  result?: string
  role?: string
  labels?: { challenge?: string; approach?: string; result?: string }
}) {
  const [open, setOpen] = useState(false)
  const caseStudy = [
    { label: labels?.challenge ?? 'Aufgabe', text: challenge },
    { label: labels?.approach ?? 'Vorgehen', text: approach },
    { label: labels?.result ?? 'Ergebnis', text: result },
    { label: 'Rolle', text: role },
    { label: 'Jahr', text: year },
  ].filter((entry) => entry.text)
  const hasMore = Boolean(description || year || caseStudy.length > 0)

  return (
    <div className="px-4 py-1.5 min-h-[36px]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-nowrap items-center gap-x-3 overflow-hidden">
          <h2 className="font-medium shrink-0">{title}</h2>
          <span className="flex min-w-0 items-center gap-x-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex shrink-0 items-center h-5 px-2 rounded-full border border-[var(--ink)]/25 text-[11px] font-medium"
            >
              {tag}
            </span>
          ))}
          </span>
          {client && <span className="hidden sm:inline shrink-0 text-sm text-[var(--ink-muted)]">{client}</span>}
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Projektinfo schliessen' : 'Projektinfo öffnen'}
            className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full border border-[var(--ink)]/25 hover:bg-[var(--ink)] hover:text-[var(--bg)] transition-colors duration-300"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="transition-transform duration-500 ease-out"
              style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
              aria-hidden
            >
              <path d="M6 1v10M1 6h10" />
            </svg>
          </button>
        )}
      </div>

      {hasMore && (
        <div
          className="grid transition-[grid-template-rows,opacity] duration-500 ease-out"
          style={{ gridTemplateRows: open ? '1fr' : '0fr', opacity: open ? 1 : 0 }}
        >
          <div className="overflow-hidden">
            <div className="pt-4 pb-1 flex flex-col gap-4 text-sm">
              {description && <p className="max-w-xl text-[var(--ink-muted)]">{description}</p>}
              {caseStudy.length > 0 && (
                <dl className="flex flex-wrap gap-x-6 gap-y-3 max-w-5xl">
                  {caseStudy.map((entry) => (
                    <div key={entry.label} className={entry.label === 'Jahr' ? 'flex-none' : 'flex-1 min-w-[9rem]'}>
                      <dt className="text-[var(--ink-muted)]">{entry.label}</dt>
                      <dd>{entry.text}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
