import { defineField, defineType } from 'sanity'

export const designAbout = defineType({
  name: 'designAbout',
  title: 'Grafikdesign — Info',
  type: 'document',
  fields: [
    defineField({
      name: 'bio',
      title: 'Profil-Text',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'services',
      title: 'Leistungen',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Eine Zeile pro Leistung, z.B. "Branding", "Editorial Design".',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Grafikdesign — Info' }),
  },
})
