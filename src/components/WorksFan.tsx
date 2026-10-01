'use client'

import Image from 'next/image'
import { useSyncExternalStore } from 'react'
import { DRAG_THRESHOLD, getBottomPullState, subscribeBottomPull } from '@/lib/bottomPull'

export type FanWork = { id: string; src: string; alt: string }

// Wie viel vom geschlossenen Stapel unten dauerhaft "angeschnitten" bleibt —
// eine Maske in Seitenfarbe deckt diesen Streifen ab, statt die Karten mit
// overflow zu clippen (so bleibt beim Aufziehen oben alles unbeschnitten).
const MASK_HEIGHT = 64

export function WorksFan({ works }: { works: FanWork[] }) {
  const { dragY, tensioned } = useSyncExternalStore(subscribeBottomPull, getBottomPullState, getBottomPullState)
  const progress = Math.min(1, dragY / DRAG_THRESHOLD)

  if (works.length === 0) return null

  const center = (works.length - 1) / 2

  return (
    <div aria-hidden className="sm:hidden relative h-48 pointer-events-none">
      <div
        className={tensioned ? 'fan-tension' : undefined}
        style={{ position: 'absolute', left: '50%', bottom: 0, width: 0, height: 0 }}
      >
        {works.map((work, i) => {
          const offset = i - center
          const angle = offset * 15 * progress
          const lift = progress * 230
          const scale = 0.88 + 0.12 * progress
          const closedOpacity = 0.7 + 0.1 * Math.max(0, 1 - Math.abs(offset) * 0.3)
          const opacity = closedOpacity + (1 - closedOpacity) * progress

          return (
            <div
              key={work.id}
              className="absolute left-1/2 bottom-0 w-32 aspect-[3/4] rounded-md overflow-hidden shadow-[0_3px_8px_rgba(0,0,0,0.22)]"
              style={{
                viewTransitionName: `fan-work-${work.id}`,
                transform: `translateX(-50%) translateX(${offset * 4}px) rotate(${angle}deg) translateY(${-lift}px) scale(${scale})`,
                opacity,
              }}
            >
              <Image src={work.src} alt={work.alt} fill sizes="128px" className="object-cover" />
            </div>
          )
        })}
      </div>
      {/* Deckt den unteren Streifen der Karten (inkl. ihrem Schlagschatten)
          permanent ab, damit der Fächer immer "angeschnitten" wirkt, ohne
          das Aufklappen nach oben zu clippen. */}
      <div className="absolute inset-x-0 bg-[var(--bg)]" style={{ bottom: -16, height: MASK_HEIGHT + 16 }} />
    </div>
  )
}
