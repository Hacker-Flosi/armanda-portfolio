'use client'

import { useState } from 'react'
import Image from 'next/image'
import { LazyVideo } from '@/components/LazyVideo'
import type { TimelineView } from '@/lib/designMedia'
import { AutoSlider } from '@/components/AutoSlider'
import { MobileProjectCarousel } from '@/components/MobileProjectCarousel'
import { ProjectHeader } from '@/components/ProjectHeader'
import { SeriesDetail } from '@/components/SeriesDetail'
import { EnlargeBadge } from '@/components/EnlargeBadge'

const STACK_LAYERS = 4

// Kunde mit mehreren Serien: sieht aus wie ein Projekt (gleicher Kopf, gleiche
// Bildreihe), die Serien sind als Stapel wählbar. Pro Serie läuft darunter die
// gewohnte Reihe; Jahre erscheinen nur als Kleintext im Bild.
export function ProjectClusters({ timeline }: { timeline: TimelineView }) {
  const lanes = timeline.lanes.filter((lane) => lane.items.length > 0)
  const [activeKey, setActiveKey] = useState(lanes[0]?.key ?? '')
  const [open, setOpen] = useState<number | null>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  if (lanes.length === 0) return null

  const active = lanes.find((lane) => lane.key === activeKey) ?? lanes[0]
  const total = lanes.reduce((sum, lane) => sum + lane.items.length, 0)

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0">
      <ProjectHeader
        title={timeline.title}
        tags={lanes.map((lane) => lane.name)}
        client={`${total} Arbeiten`}
        description={timeline.text}
      />
      </div>

      <div className="shrink-0 flex gap-4 md:gap-6 overflow-x-auto px-4 pt-0 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {lanes.map((lane) => {
          const selected = lane.key === active.key
          const spread = hovered === lane.key
          const layers = lane.items.slice(0, STACK_LAYERS)
          return (
            <button
              key={lane.key}
              type="button"
              aria-pressed={selected}
              onClick={() => setActiveKey(lane.key)}
              onMouseEnter={() => setHovered(lane.key)}
              onMouseLeave={() => setHovered(null)}
              className="shrink-0 w-[30vw] min-w-[120px] max-w-[170px] pt-9 pr-9 text-left cursor-pointer transition-opacity duration-500"
              style={{ opacity: selected ? 1 : 0.45 }}
            >
              <div className="relative w-full aspect-[4/5]">
                {layers
                  .map((item, i) => ({ item, depth: layers.length - 1 - i }))
                  .reverse()
                  .map(({ item, depth }) => {
                    const step = spread ? 12 : 6
                    return (
                      <div
                        key={item.key}
                        className="absolute inset-0 overflow-hidden bg-white/[0.06] transition-transform duration-500 ease-out"
                        style={{
                          transform: `translate(${depth * step}px, ${-depth * step}px) scale(${1 - depth * 0.04})`,
                          zIndex: layers.length - depth,
                          transformOrigin: 'bottom left',
                        }}
                      >
                        {item.kind === 'video' ? (
                          <LazyVideo src={item.src} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <Image src={item.src} alt="" fill sizes="130px" className="object-cover" />
                        )}
                      </div>
                    )
                  })}
              </div>
              <div className="pt-3 flex items-baseline gap-2">
                <span className="font-medium">{lane.name}</span>
                <span className="text-sm text-[var(--ink-muted)]">{lane.items.length}</span>
              </div>
            </button>
          )
        })}
      </div>

      <div key={active.key} className="archive-tile flex-1 min-h-0 flex flex-col">
        {active.description && <p className="shrink-0 px-4 pb-3 text-sm text-[var(--ink-muted)] max-w-xl">{active.description}</p>}
        <div className="sm:hidden flex-1 min-h-0">
          <MobileProjectCarousel
            key={active.key}
            items={active.items.map((item) => ({ key: item.key, kind: item.kind, src: item.src, aspectRatio: item.aspectRatio, caption: String(item.year) }))}
            label={active.name}
            onOpen={setOpen}
          />
        </div>
        <AutoSlider className="hidden sm:block flex-1 min-h-0">
          {active.items.map((item, index) => (
            <button
              key={item.key}
              type="button"
              aria-label={`${item.title} ${item.year}`}
              onClick={() => setOpen(index)}
              className="relative shrink-0 overflow-hidden bg-white/[0.04] h-[min(100%,calc(88vw/var(--ratio)))] md:h-full group"
              style={{ aspectRatio: item.kind === 'video' ? 16 / 9 : (item.aspectRatio ?? 1.3), ['--ratio' as string]: item.kind === 'video' ? 16 / 9 : (item.aspectRatio ?? 1.3) }}
            >
              {item.kind === 'video' ? (
                <LazyVideo src={item.src} className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  sizes="(min-width: 768px) 60vw, 80vw"
                  draggable={false}
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              )}
              <span className="absolute left-3 bottom-3 text-xs text-white/80">{item.year}</span>
              <EnlargeBadge />
            </button>
          ))}
        </AutoSlider>
      </div>

      {open !== null && <SeriesDetail lane={active.name} items={active.items} startIndex={open} onClose={() => setOpen(null)} />}
    </div>
  )
}
