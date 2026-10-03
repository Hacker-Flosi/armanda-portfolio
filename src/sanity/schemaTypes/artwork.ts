import { defineField, defineType } from 'sanity'
import { nextOrder } from '../lib/nextOrder'

export const artwork = defineType({
  name: 'artwork',
  title: 'Werk',
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
      title: 'Bilder',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'artworkImage',
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
                'Auf dem Handy wird pro Werk nur ein Bild in der Übersicht gezeigt. Dieses hier markieren, damit es das ist — die übrigen Bilder bleiben trotzdem im Lightbox-Vollbild abrufbar.',
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
      name: 'edition',
      title: 'Edition',
      type: 'string',
      initialValue: '1/1',
    }),
    defineField({
      name: 'year',
      title: 'Jahr',
      type: 'string',
    }),
    defineField({
      name: 'dimensions',
      title: 'Masse',
      type: 'string',
      description: 'z.B. 200 x 150 cm',
    }),
    defineField({
      name: 'medium',
      title: 'Medium',
      type: 'string',
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Verfügbar', value: 'verfuegbar' },
          { title: 'Verkauft', value: 'verkauft' },
          { title: 'Kein Status', value: 'none' },
        ],
        layout: 'radio',
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'order',
      title: 'Reihenfolge',
      type: 'number',
      initialValue: nextOrder('artwork'),
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
    select: { title: 'title', subtitle: 'year', media: 'images.0.image' },
  },
})
