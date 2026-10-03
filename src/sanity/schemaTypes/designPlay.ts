import { defineField, defineType } from 'sanity'
import { nextOrder } from '../lib/nextOrder'

export const designPlay = defineType({
  name: 'designPlay',
  title: 'Spielwiese',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Titel (optional)',
      type: 'string',
    }),
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
      description: 'Entweder ein Bild ODER ein Video. Video: MP4 (H.264), möglichst unter 20 MB.',
    }),
    defineField({
      name: 'order',
      title: 'Reihenfolge',
      type: 'number',
      description: 'Wird bei neuen Einträgen automatisch ans Ende gesetzt. Kleinere Zahl erscheint weiter oben.',
      initialValue: nextOrder('designPlay'),
      validation: (rule) => rule.required(),
    }),
  ],
  validation: (rule) =>
    rule.custom((value) => {
      const doc = value as { image?: unknown; video?: unknown } | undefined
      return doc?.image || doc?.video ? true : 'Bild oder Video wählen'
    }),
  orderings: [{ title: 'Reihenfolge', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  preview: { select: { title: 'title', media: 'image' } },
})
