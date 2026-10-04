import { urlFor } from '@/sanity/lib/image'
import type { DesignPlay, DesignTimeline, DesignWork } from '@/sanity/lib/queries'

export type MediaTile = {
  key: string
  kind: 'image' | 'video'
  src: string
  fullSrc?: string
  aspectRatio: number | null
  label: string
}

export function worksToTiles(works: DesignWork[]): MediaTile[] {
  return works.flatMap((work) =>
    (work.images ?? []).flatMap((entry, i): MediaTile[] => {
      const key = `${work._id}-${i}`
      if (entry.videoUrl) {
        return [{ key, kind: 'video', src: entry.videoUrl, aspectRatio: entry.aspectRatio, label: work.title }]
      }
      if (!entry.image) return []
      return [
        {
          key,
          kind: 'image',
          src: urlFor(entry.image).width(1200).fit('max').auto('format').url(),
          fullSrc: urlFor(entry.image).width(2800).fit('max').auto('format').url(),
          aspectRatio: entry.aspectRatio,
          label: work.title,
        },
      ]
    })
  )
}

export function playToTiles(items: DesignPlay[]): MediaTile[] {
  return items.flatMap((item): MediaTile[] => {
    if (item.videoUrl) {
      return [{ key: item._id, kind: 'video', src: item.videoUrl, aspectRatio: null, label: item.title ?? 'Spielwiese' }]
    }
    if (!item.image) return []
    return [
      {
        key: item._id,
        kind: 'image',
        src: urlFor(item.image).width(1200).fit('max').auto('format').url(),
        fullSrc: urlFor(item.image).width(2800).fit('max').auto('format').url(),
        aspectRatio: item.aspectRatio,
        label: item.title ?? 'Spielwiese',
      },
    ]
  })
}

export type TimelineItemView = {
  key: string
  title: string
  year?: number
  note?: string
  kind: 'image' | 'video'
  src: string
  fullSrc?: string
  aspectRatio: number | null
}

export type TimelineView = {
  id: string
  title: string
  text?: string
  lanes: { key: string; name: string; description?: string; items: TimelineItemView[] }[]
}

export function timelineToView(timeline: DesignTimeline): TimelineView {
  return {
    id: timeline._id,
    title: timeline.title,
    text: timeline.text,
    lanes: (timeline.lanes ?? []).map((lane) => ({
      key: lane._key,
      name: lane.name,
      description: lane.description,
      items: (lane.items ?? [])
        .flatMap((item): TimelineItemView[] => {
          const base = { key: item._key, title: item.title ?? lane.name, year: item.year, note: item.note }
          if (item.videoUrl) return [{ ...base, kind: 'video', src: item.videoUrl, aspectRatio: null }]
          if (!item.image) return []
          return [
            {
              ...base,
              kind: 'image',
              src: urlFor(item.image).width(900).fit('max').auto('format').url(),
              fullSrc: urlFor(item.image).width(2400).fit('max').auto('format').url(),
              aspectRatio: item.aspectRatio,
            },
          ]
        })
        .sort((a, b) => (a.year !== undefined && b.year !== undefined ? a.year - b.year : 0)),
    })),
  }
}

export function timelineToTiles(view: TimelineView): MediaTile[] {
  return view.lanes.flatMap((lane) =>
    lane.items.map((item): MediaTile => ({
      key: `${view.id}-${item.key}`,
      kind: item.kind,
      src: item.src,
      fullSrc: item.fullSrc,
      aspectRatio: item.aspectRatio,
      label: [`${view.title} · ${lane.name}`, item.year].filter(Boolean).join(' '),
    }))
  )
}
