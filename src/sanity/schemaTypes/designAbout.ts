import { defineField, defineType } from 'sanity'

export const designAbout = defineType({
  name: 'designAbout',
  title: 'Grafikdesign — Info',
  type: 'document',
  fields: [
    defineField({
      name: 'introText',
      title: 'Startseite — Einleitung',
      type: 'text',
      rows: 3,
      description: 'Kurzer Begrüssungstext über dem Video.',
    }),
    defineField({
      name: 'introVideo',
      title: 'Startseite — Vorstellungsvideo',
      type: 'file',
      options: { accept: 'video/*' },
    }),
    defineField({
      name: 'process',
      title: 'Ablauf der Zusammenarbeit',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'processStep',
          fields: [
            defineField({ name: 'title', title: 'Schritt', type: 'string' }),
            defineField({ name: 'text', title: 'Beschreibung', type: 'text', rows: 2 }),
          ],
          preview: { select: { title: 'title', subtitle: 'text' } },
        },
      ],
    }),
    defineField({
      name: 'bio',
      title: 'Profil — wer ich bin (Ich-Form)',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'approach',
      title: 'Wie ich arbeite (Ich-Form)',
      type: 'text',
      rows: 6,
      description: 'Zweiter Absatz — wie sie an Projekte herangeht.',
    }),
    defineField({
      name: 'spotifyPlaylistUrl',
      title: 'Spotify-Playlist',
      type: 'url',
      description:
        'Link zu einer öffentlichen Spotify-Playlist (Teilen → Playlist-Link kopieren). Erscheint unter "Abseits der Arbeit" als Player, der erst nach einem Klick geladen wird.',
    }),
    defineField({
      name: 'loves',
      title: 'Was mir an meinem Beruf gefällt (Ich-Form)',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'looking',
      title: 'Was ich suche (Ich-Form)',
      type: 'text',
      rows: 5,
      description: 'Welche Stelle, welches Team, welche Aufgaben.',
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
