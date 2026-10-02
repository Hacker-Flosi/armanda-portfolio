'use client'

import Image from 'next/image'
import { useEffect, useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import {
  DRAG_THRESHOLD,
  activateBottomPull,
  getBottomPullState,
  resetBottomPull,
  setBottomPullNavigate,
  subscribeBottomPull,
} from '@/lib/bottomPull'
import { navigateWithFanTransition } from '@/lib/viewTransition'

export type PullFanItem = { id: string; src: string; alt: string; viewTransitionName?: string }

// Zieht den Fächer unter den (deckenden, höher gestapelten) Footer, damit er
// dort real angeschnitten wird statt mit einer künstlichen Maske simuliert.
const FOOTER_OVERLAP = 52

// Generische "Zieh dich zur nächsten Seite"-Geste am unteren Seitenrand: ein
// Fächer aus Vorschaubildern öffnet sich mit dem Zug (oder dem Schwung eines
// schnellen Scrolls, siehe bottomPull.ts) und navigiert bei genug Zug/Schwung
// zu `href`. Wird von WorksFan (Info -> Werke) und InfoFan (Werke -> Info)
// mit ihren jeweiligen Bildern wiederverwendet.
export function PullFan({ items, href }: { items: PullFanItem[]; href: string }) {
  const router = useRouter()
  const { pull, tensioned, dragging } = useSyncExternalStore(
    subscribeBottomPull,
    getBottomPullState,
    getBottomPullState
  )
  const progress = Math.min(1, pull / DRAG_THRESHOLD)
  // Leichte Ease-out-Kurve statt 1:1-Linear, damit das Aufziehen elastisch
  // statt mechanisch wirkt.
  const eased = 1 - (1 - progress) * (1 - progress)
  const showHint = pull === 0 && !dragging

  useEffect(() => {
    resetBottomPull()
    setBottomPullNavigate(() => navigateWithFanTransition(router, href, 'fan'))
    return () => setBottomPullNavigate(null)
  }, [router, href])

  if (items.length === 0) return null

  const center = (items.length - 1) / 2

  return (
    <button
      type="button"
      aria-label="Weiter"
      onClick={activateBottomPull}
      className={`sm:hidden relative block w-full h-48 cursor-pointer ${showHint ? 'fan-hint' : ''}`}
      style={{ marginBottom: -FOOTER_OVERLAP }}
    >
      <div
        className={tensioned ? 'fan-tension' : undefined}
        style={{ position: 'absolute', left: '50%', bottom: 0, width: 0, height: 0 }}
      >
        {items.map((item, i) => {
          const offset = i - center
          const angle = offset * 15 * eased
          const lift = eased * 230
          const scale = 0.88 + 0.12 * eased
          const closedOpacity = 0.7 + 0.1 * Math.max(0, 1 - Math.abs(offset) * 0.3)
          const opacity = closedOpacity + (1 - closedOpacity) * eased

          return (
            <div
              key={item.id}
              className="absolute left-1/2 bottom-0 w-32 aspect-[3/4] rounded-md overflow-hidden shadow-[0_3px_8px_rgba(0,0,0,0.22)]"
              style={{
                viewTransitionName: item.viewTransitionName ?? `fan-work-${item.id}`,
                transform: `translateX(-50%) translateX(${offset * 4}px) rotate(${angle}deg) translateY(${-lift}px) scale(${scale})`,
                opacity,
                transition: dragging
                  ? 'none'
                  : 'transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.45s ease',
              }}
            >
              <Image src={item.src} alt={item.alt} fill sizes="128px" className="object-cover" />
            </div>
          )
        })}
      </div>
    </button>
  )
}
