import { defineField, defineType } from 'sanity'

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
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'images',
      title: 'Bilder',
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
              validation: (rule) => rule.required(),
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
          preview: {
            select: { media: 'image', isMobileCover: 'isMobileCover' },
            prepare: ({ media, isMobileCover }) => ({
              title: isMobileCover ? 'Mobil-Titelbild' : 'Bild',
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
      name: 'category',
      title: 'Kategorie',
      type: 'string',
      description: 'z.B. Branding, Editorial, Verpackung, Typografie',
    }),
    defineField({
      name: 'year',
      title: 'Jahr',
      type: 'string',
    }),
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
