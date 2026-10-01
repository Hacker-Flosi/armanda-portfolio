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
      name: 'approach',
      title: 'Ansatz-Text',
      type: 'text',
      rows: 6,
      description: 'Zweiter Absatz — wie sie an Projekte herangeht.',
    }),
    defineField({
      name: 'services',
      title: 'Leistungen',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Eine Zeile pro Leistung, z.B. "Branding", "Editorial Design".',
    }),
    defineField({
      name: 'clients',
      title: 'Kunden',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Leer lassen, bis es echte Kunden zum Nennen gibt.',
    }),
    defineField({
      name: 'industries',
      title: 'Branchen',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Branchen/Themenfelder, in denen sie gerne arbeitet.',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Grafikdesign — Info' }),
  },
})
