import { defineField, defineType } from 'sanity'

export const designAbout = defineType({
  name: 'designAbout',
  title: 'Grafikdesign — Info',
  type: 'document',
  groups: [
    { name: 'start', title: 'Startseite', default: true },
    { name: 'info', title: 'Info-Seite' },
    { name: 'private', title: 'Abseits & Kunst' },
  ],
  fields: [
    defineField({
      name: 'introText',
      group: 'start',
      title: 'Startseite — Einleitung',
      type: 'text',
      rows: 3,
      description: 'Kurzer Begrüssungstext über dem Video.',
    }),
    defineField({
      name: 'introVideo',
      group: 'start',
      title: 'Startseite — Hintergrund-Loop (stumm)',
      type: 'file',
      options: { accept: 'video/*' },
      description: 'Kurzer stummer Loop (10–20 Sekunden, möglichst unter 4 MB) unter dem Einleitungstext. MP4 (H.264), Querformat, mit "Fast Start".',
    }),
    defineField({
      name: 'introFullVideo',
      group: 'start',
      title: 'Startseite — Vollversion (bei Klick)',
      type: 'file',
      options: { accept: 'video/*' },
      description:
        'Optional: das lange Video. Es lädt erst, wenn jemand auf Play oder Vollbild tippt — der Loop oben läuft bis dahin im Hintergrund. MP4 (H.264) mit "Fast Start / Web-optimiert", 1080p oder 720p, etwa 2–3 Mbit/s. Ohne Vollversion wird der Loop selbst mit Ton neu gestartet.',
    }),
    defineField({
      name: 'introPoster',
      group: 'start',
      title: 'Startseite — Vorschaubild',
      type: 'image',
      description: 'Standbild aus dem Video: erscheint sofort, bis das Video läuft. Querformat, wie das Video.',
    }),
    defineField({
      name: 'process',
      group: 'info',
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
      group: 'info',
      title: 'Profil — wer ich bin (Ich-Form)',
      type: 'text',
      rows: 6,
    }),
    defineField({
      name: 'approach',
      group: 'info',
      title: 'Wie ich arbeite (Ich-Form)',
      type: 'text',
      rows: 6,
      description: 'Zweiter Absatz — wie sie an Projekte herangeht.',
    }),
    defineField({
      name: 'spotifyPlaylistUrl',
      group: 'private',
      title: 'Spotify-Playlist',
      type: 'url',
      description:
        'Link zu einer öffentlichen Spotify-Playlist (Teilen → Playlist-Link kopieren). Erscheint unter "Abseits der Arbeit" als Player, der erst nach einem Klick geladen wird.',
    }),
    defineField({
      name: 'loves',
      group: 'info',
      title: 'Was mir an meinem Beruf gefällt (Ich-Form)',
      type: 'text',
      rows: 5,
    }),
    defineField({
      name: 'artText',
      group: 'private',
      title: 'Meine Kunst — Text (Ich-Form)',
      type: 'text',
      rows: 4,
      description: 'Kurzer Text, der auf die Kunst-Seite überleitet. Die Werke darunter kommen automatisch aus dem Kunst-Portfolio.',
    }),
    defineField({
      name: 'looking',
      group: 'info',
      title: 'Was ich suche (Ich-Form)',
      type: 'text',
      rows: 5,
      description: 'Welche Stelle, welches Team, welche Aufgaben.',
    }),
    defineField({
      name: 'services',
      group: 'info',
      title: 'Leistungen',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Eine Zeile pro Leistung, z.B. "Branding", "Editorial Design".',
    }),
    defineField({
      name: 'industries',
      group: 'info',
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
