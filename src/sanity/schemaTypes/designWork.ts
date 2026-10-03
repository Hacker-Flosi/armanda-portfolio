import { defineField, defineType } from 'sanity'
import { nextOrder } from '../lib/nextOrder'

export const designWork = defineType({
  name: 'designWork',
  title: 'Grafik-Arbeit',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      hidden: true,
    }),
    defineField({
      name: 'images',
      title: 'Medien (Bilder & Videos)',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'designImage',
          fields: [
            defineField({
              name: 'image',
              title: 'Bild',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'video',
              title: 'Video',
              type: 'file',
              options: { accept: 'video/*' },
              description: 'Entweder ein Bild ODER ein Video pro Eintrag. Video: MP4 (H.264), möglichst unter 20 MB.',
            }),
            defineField({
              name: 'isMobileCover',
              title: 'Mobil-Titelbild',
              type: 'boolean',
              description:
                'Auf dem Handy wird pro Arbeit nur ein Bild in der Übersicht gezeigt. Dieses hier markieren, damit es das ist — die übrigen Bilder bleiben trotzdem im Lightbox-Vollbild abrufbar.',
              initialValue: false,
            }),
          ],
          validation: (rule) =>
            rule.custom((value) => {
              const item = value as { image?: unknown; video?: unknown } | undefined
              return item?.image || item?.video ? true : 'Bild oder Video wählen'
            }),
          preview: {
            select: { media: 'image', video: 'video.asset._ref', isMobileCover: 'isMobileCover' },
            prepare: ({ media, video, isMobileCover }) => ({
              title: `${video ? 'Video' : 'Bild'}${isMobileCover ? ' (Mobil-Titelbild)' : ''}`,
              media,
            }),
          },
        },
      ],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'client',
      title: 'Kunde',
      type: 'string',
      description: 'z.B. Name des Auftraggebers — leer lassen bei privaten/eigenen Arbeiten.',
    }),
    defineField({
      name: 'tags',
      title: 'Kategorien (Tags)',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      description: 'Beliebig viele, z.B. Branding, Editorial, Verpackung, Typografie.',
    }),
    defineField({
      name: 'year',
      title: 'Jahr',
      type: 'string',
    }),
    defineField({ name: 'challenge', title: 'Fallstudie — Aufgabe', type: 'text', rows: 3 }),
    defineField({ name: 'approach', title: 'Fallstudie — Vorgehen', type: 'text', rows: 3 }),
    defineField({ name: 'result', title: 'Fallstudie — Ergebnis', type: 'text', rows: 3 }),
    defineField({ name: 'role', title: 'Fallstudie — Armandas Rolle', type: 'string' }),
    defineField({
      name: 'description',
      title: 'Beschreibung',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'order',
      title: 'Reihenfolge',
      type: 'number',
      initialValue: nextOrder('designWork'),
      description: 'Kleinere Zahl erscheint weiter oben in der Liste.',
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [
    {
      title: 'Reihenfolge',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'client', media: 'images.0.image' },
  },
})
