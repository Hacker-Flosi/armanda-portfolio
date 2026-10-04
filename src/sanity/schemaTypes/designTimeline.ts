import { defineField, defineType } from 'sanity'
import { nextOrder } from '../lib/nextOrder'

export const designTimeline = defineType({
  name: 'designTimeline',
  title: 'Kunde mit Serien (z.B. Tsüri.ch)',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Kunde / Titel', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'text',
      title: 'Beschrieb',
      type: 'text',
      rows: 4,
      description: 'Erscheint im aufklappbaren Plus-Bereich.',
    }),
    defineField({
      name: 'lanes',
      title: 'Serien',
      type: 'array',
      description: 'Eine Serie fasst zusammengehörige Arbeiten zusammen, z.B. Plakatserie, Merch, Gutscheinhefte.',
      of: [
        {
          type: 'object',
          name: 'timelineLane',
          fields: [
            defineField({ name: 'name', title: 'Name der Serie', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'description', title: 'Beschrieb der Serie', type: 'text', rows: 3 }),
            defineField({
              name: 'items',
              title: 'Arbeiten',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'timelineItem',
                  fields: [
                    defineField({ name: 'title', title: 'Titel', type: 'string' }),
                    defineField({
                      name: 'year',
                      title: 'Jahr',
                      type: 'number',
                      description: 'Optional.',
                      validation: (rule) => rule.integer().min(1990).max(2100),
                    }),
                    defineField({ name: 'note', title: 'Notiz', type: 'text', rows: 2, description: 'Erscheint direkt am Bild und in der Grossansicht — ersetzt die Jahresangabe.' }),
                    defineField({ name: 'image', title: 'Bild', type: 'image', options: { hotspot: true } }),
                    defineField({
                      name: 'video',
                      title: 'Video',
                      type: 'file',
                      options: { accept: 'video/*' },
                      description: 'Entweder ein Bild ODER ein Video. Video: MP4 (H.264), möglichst unter 20 MB.',
                    }),
                  ],
                  validation: (rule) =>
                    rule.custom((value) => {
                      const item = value as { image?: unknown; video?: unknown } | undefined
                      return item?.image || item?.video ? true : 'Bild oder Video wählen'
                    }),
                  preview: {
                    select: { title: 'title', year: 'year', note: 'note', media: 'image' },
                    prepare: ({ title, year, note, media }) => ({ title: title || 'Arbeit', subtitle: note || (year ? String(year) : ''), media }),
                  },
                },
              ],
            }),
          ],
          preview: {
            select: { title: 'name', items: 'items' },
            prepare: ({ title, items }) => ({ title, subtitle: `${items?.length ?? 0} Arbeiten` }),
          },
        },
      ],
    }),
    defineField({
      name: 'order',
      title: 'Reihenfolge',
      type: 'number',
      description: 'Wird bei neuen Einträgen automatisch ans Ende gesetzt. Kleinere Zahl erscheint weiter oben.',
      initialValue: nextOrder('designTimeline'),
      validation: (rule) => rule.required(),
    }),
  ],
  orderings: [{ title: 'Reihenfolge', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title' } },
})
