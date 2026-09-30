import { defineField, defineType } from 'sanity'

export const about = defineType({
  name: 'about',
  title: 'Info-Seite',
  type: 'document',
  fields: [
    defineField({
      name: 'photo',
      title: 'Foto',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'bio',
      title: 'Bio-Text',
      type: 'text',
      rows: 12,
    }),
    defineField({
      name: 'exhibitions',
      title: 'Ausstellungen',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'exhibition',
          fields: [
            defineField({ name: 'year', title: 'Jahr', type: 'string' }),
            defineField({ name: 'type', title: 'Typ', type: 'string' }),
            defineField({ name: 'title', title: 'Titel', type: 'string' }),
            defineField({ name: 'location', title: 'Ort', type: 'string' }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'year' },
          },
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Info-Seite' }),
  },
})
