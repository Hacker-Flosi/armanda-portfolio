import { defineField, defineType } from 'sanity'
import { nextOrder } from '../lib/nextOrder'

export const designInterest = defineType({
  name: 'designInterest',
  title: 'Abseits der Arbeit (Fotos & Platten)',
  type: 'document',
  fields: [
    defineField({
      name: 'kind',
      title: 'Art',
      type: 'string',
      options: {
        list: [
          { title: 'Privates Foto', value: 'foto' },
          { title: 'Platte', value: 'platte' },
        ],
        layout: 'radio',
      },
      initialValue: 'foto',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Titel',
      type: 'string',
      description: 'Foto: kurze Bildunterschrift. Platte: Albumtitel.',
    }),
    defineField({ name: 'artist', title: 'Interpret (nur Platten)', type: 'string' }),
    defineField({ name: 'year', title: 'Jahr (optional)', type: 'string' }),
    defineField({
      name: 'spotifyUrl',
      title: 'Spotify-Link (Album, nur Platten)',
      type: 'url',
      description:
        'In Spotify: Album öffnen → "..." → Teilen → "Album-Link kopieren". Beim Aufziehen der Platte erscheint dann der Spotify-Player.',
    }),
    defineField({
      name: 'note',
      title: 'Notiz',
      type: 'text',
      rows: 3,
      description: 'Warum ist das wichtig? Wo ist das Foto entstanden? Was hörst du daran?',
    }),
    defineField({
      name: 'image',
      title: 'Bild / Cover',
      type: 'image',
      options: { hotspot: true },
      description:
        'Bei Platten mit Spotify-Link kann das leer bleiben: dann wird das Cover automatisch von Spotify geholt.',
    }),
    defineField({ name: 'order', title: 'Reihenfolge', type: 'number',
      description: 'Wird bei neuen Einträgen automatisch ans Ende gesetzt. Kleinere Zahl erscheint weiter oben.',
      initialValue: nextOrder('designInterest'), validation: (rule) => rule.required() }),
  ],
  orderings: [{ title: 'Reihenfolge', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] }],
  validation: (rule) =>
    rule.custom((value) => {
      const doc = value as { image?: unknown; spotifyUrl?: unknown } | undefined
      return doc?.image || doc?.spotifyUrl ? true : 'Bild hochladen oder (bei Platten) einen Spotify-Link angeben'
    }),
  preview: { select: { title: 'title', subtitle: 'kind', media: 'image' } },
})
