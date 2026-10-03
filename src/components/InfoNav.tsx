'use client'

import { useEffect, useRef, useState } from 'react'

// Seitliche Inhaltsnavigation der Info-Seite mit Scroll-Spy: markiert den
// Abschnitt, der gerade in der Bildschirmmitte steht.
export function InfoNav({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? '')
  const barRef = useRef<HTMLElement>(null)

  // Die aktive Pille bleibt in der horizontal scrollbaren Leiste immer
  // sichtbar (zentriert), ohne die Seite selbst zu scrollen.
  useEffect(() => {
    const bar = barRef.current
    const pill = bar?.querySelector<HTMLElement>(`[data-pill="${active}"]`)
    if (!bar || !pill) return
    const target = pill.offsetLeft - (bar.clientWidth - pill.offsetWidth) / 2
    bar.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [active])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id)
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [items])

  return (
    <>
      <nav
        ref={barRef}
        aria-label="Inhalt (mobil)"
        className="md:hidden sticky top-9 z-10 -mx-4 mb-6 px-4 py-2 flex gap-2 overflow-x-auto bg-[var(--bg)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <button
            key={item.id}
            data-pill={item.id}
            type="button"
            onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="shrink-0 h-8 px-3.5 rounded-full border text-sm transition-colors duration-300"
            style={{
              borderColor: 'color-mix(in srgb, var(--ink) 30%, transparent)',
              background: active === item.id ? 'var(--ink)' : 'transparent',
              color: active === item.id ? 'var(--bg)' : 'var(--ink)',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    <nav aria-label="Inhalt" className="hidden md:block sticky top-20 self-start">
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="group flex items-baseline gap-3 text-left cursor-pointer"
            >
              <span className="text-xs text-[var(--ink-muted)] w-5">{String(i + 1).padStart(2, '0')}</span>
              <span
                className="transition-all duration-500"
                style={{
                  opacity: active === item.id ? 1 : 0.4,
                  transform: active === item.id ? 'translateX(6px)' : 'none',
                  fontWeight: active === item.id ? 500 : 400,
                }}
              >
                {item.label}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
    </>
  )
}
