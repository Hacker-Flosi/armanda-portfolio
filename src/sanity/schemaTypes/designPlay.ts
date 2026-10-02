import { defineField, defineType } from 'sanity'

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
      description: 'Entweder ein Bild ODER ein Video.',
    }),
    defineField({
      name: 'order',
      title: 'Reihenfolge',
      type: 'number',
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
