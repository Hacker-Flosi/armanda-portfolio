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
                      validation: (rule) => rule.required().integer().min(1990).max(2100),
                    }),
                    defineField({ name: 'note', title: 'Kurztext / Idee dahinter', type: 'text', rows: 3 }),
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
                    select: { title: 'title', year: 'year', media: 'image' },
                    prepare: ({ title, year, media }) => ({ title: title || 'Arbeit', subtitle: String(year ?? ''), media }),
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
