'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { SeriesDetail } from '@/components/SeriesDetail'
import type { DetailItem } from '@/components/SeriesDetail'

type LightboxItem = { fullSrc: string; alt: string; year?: number | string; note?: string }

const LightboxContext = createContext<{ open: (index: number) => void } | null>(null)

export function useLightbox() {
  const ctx = useContext(LightboxContext)
  if (!ctx) throw new Error('useLightbox must be used inside a LightboxProvider')
  return ctx
}

export function LightboxProvider({ items, children }: { items: LightboxItem[]; children: ReactNode }) {
  const [index, setIndex] = useState<number | null>(null)
  const open = useCallback((i: number) => setIndex(i), [])
  const detailItems = useMemo<DetailItem[]>(
    () =>
      items.map((item, i) => ({
        key: String(i),
        title: item.alt,
        kind: 'image' as const,
        src: item.fullSrc,
        year: item.year,
        note: item.note,
      })),
    [items]
  )

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}
      {index !== null && <SeriesDetail lane="Werke" items={detailItems} startIndex={index} onClose={() => setIndex(null)} />}
    </LightboxContext.Provider>
  )
}

export function LightboxTrigger({
  index,
  src,
  alt,
  sizes,
  className,
}: {
  index: number
  src: string
  alt: string
  sizes: string
  className: string
}) {
  const { open } = useLightbox()
  return (
    <button
      type="button"
      onClick={() => open(index)}
      aria-label={`${alt} — Bild vergrössern`}
      className="absolute inset-0 w-full h-full cursor-zoom-in"
    >
      <Image src={src} alt={alt} fill sizes={sizes} className={className} />
    </button>
  )
}
