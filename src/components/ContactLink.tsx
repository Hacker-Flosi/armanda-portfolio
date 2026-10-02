'use client'

import type { CSSProperties } from 'react'

// Kontakt-Link in Display-Typografie: gleiche Schrift wie die Headline. Beim
// Hover rollt das Label nach oben weg und die eigentliche Adresse rollt
// nach, der Pfeil dreht sich, die Unterstreichung wird dicker.
export function ContactLink({
  href,
  onClick,
  label,
  hoverLabel,
  external,
  className,
  style,
}: {
  href?: string
  onClick?: () => void
  label: string
  hoverLabel: string
  external?: boolean
  className?: string
  style?: CSSProperties
}) {
  const Tag = (href ? 'a' : 'button') as 'a'
  return (
    <Tag
      {...(href ? { href, target: external ? '_blank' : undefined, rel: external ? 'noreferrer' : undefined } : { type: 'button', onClick })}
      className={`group relative inline-flex items-baseline gap-[0.25em] font-medium ${href ? '' : 'cursor-pointer'} ${className ?? ''}`}
      style={style}
    >
      <span className="relative inline-block overflow-hidden" style={{ height: '1.15em', lineHeight: '1.15em' }}>
        <span className="block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
          {label}
        </span>
        <span className="absolute left-0 top-full block whitespace-nowrap transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-full">
          {hoverLabel}
        </span>
      </span>
      <span
        aria-hidden
        className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-[-45deg]"
      >
        →
      </span>
      <span className="absolute left-0 right-0 bottom-[0.02em] h-[0.04em] group-hover:h-[0.1em] bg-current transition-[height] duration-300" />
    </Tag>
  )
}
