import { defineField, defineType } from 'sanity'
import { DEADLINES, EFFORTS, MOTIF_COUNTS, PROJECT_TYPES, USAGES } from '../../lib/illustrationPricing'

const optionList = [
  ...PROJECT_TYPES.map((o) => ({ title: `Wofür · ${o.label}`, value: `type:${o.id}` })),
  ...MOTIF_COUNTS.map((o) => ({ title: `Anzahl · ${o.label}`, value: `motifs:${o.id}` })),
  ...EFFORTS.map((o) => ({ title: `Aufwand · ${o.label}`, value: `effort:${o.id}` })),
  ...USAGES.map((o) => ({ title: `Nutzung · ${o.label}`, value: `usage:${o.id}` })),
  ...DEADLINES.map((o) => ({ title: `Termin · ${o.label}`, value: `deadline:${o.id}` })),
]

const text = (name: string, title: string, rows = 3, description?: string) =>
  defineField({ name, title, type: 'text', rows, description })

export const illustrationPage = defineType({
  name: 'illustrationPage',
  title: 'Illustration — Seite',
  type: 'document',
  groups: [
    { name: 'start', title: 'Einstieg', default: true },
    { name: 'handwerk', title: 'Handwerk' },
    { name: 'proof', title: 'Beispiele & Stimmen' },
    { name: 'konfigurator', title: 'Dein Projekt (Bilder)' },
    { name: 'ablauf', title: 'Ablauf & Fragen' },
  ],
  fields: [
    defineField({ name: 'heroTitle', group: 'start', title: 'Überschrift', type: 'string', description: 'Die grosse Aussage ganz oben.' }),
    { ...text('heroText', 'Einleitung', 4, 'Zwei, drei Sätze in Ich-Form. Leer lassen = Standardtext.'), group: 'start' },

    defineField({ name: 'handworkTitle', group: 'handwerk', title: 'Überschrift', type: 'string' }),
    { ...text('handworkText', 'Text', 4), group: 'handwerk' },
    defineField({
      name: 'handworkSteps',
      group: 'handwerk',
      title: 'Von der Skizze zur Illustration (drei Bilder)',
      type: 'array',
      description: 'Zum Beispiel Skizze, Entwurf, fertige Illustration, am besten vom selben Motiv.',
      of: [
        {
          type: 'object',
          name: 'handworkStep',
          fields: [
            defineField({ name: 'title', title: 'Titel', type: 'string' }),
            defineField({ name: 'text', title: 'Kurztext', type: 'string' }),
            defineField({ name: 'image', title: 'Bild', type: 'image', options: { hotspot: true } }),
          ],
          preview: { select: { title: 'title', media: 'image' } },
        },
      ],
    }),
    defineField({
      name: 'benefits',
      group: 'handwerk',
      title: 'Was du davon hast',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'benefit',
          fields: [
            defineField({ name: 'figure', title: 'Grosse Zahl oder Kürzel', type: 'string', description: 'z.B. "100 %", "CH", "8+"' }),
            defineField({ name: 'title', title: 'Titel', type: 'string' }),
            defineField({ name: 'text', title: 'Text', type: 'text', rows: 2 }),
          ],
          preview: { select: { title: 'title', subtitle: 'text' } },
        },
      ],
    }),

    defineField({
      name: 'casesIntro',
      group: 'proof',
      title: 'Fallstudien — Einleitung',
      type: 'text',
      rows: 3,
      description: 'Ein, zwei Sätze, warum manche Themen eine Illustration brauchen. Leer lassen = Standardtext.',
    }),
    defineField({
      name: 'cases',
      group: 'proof',
      title: 'Fallstudien',
      type: 'array',
      description:
        'Zwei bis vier Projekte als Geschichte: ein schwieriges Thema, das sich nicht fotografieren lässt, und wie die Illustration es zeigt. Leer lassen = die ersten Grafik-Projekte als Vorschau.',
      of: [
        {
          type: 'object',
          name: 'caseStudy',
          fields: [
            defineField({ name: 'title', title: 'Titel', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'client', title: 'Kunde', type: 'string' }),
            defineField({
              name: 'tags',
              title: 'Themen (Tags)',
              type: 'array',
              of: [{ type: 'string' }],
              options: { layout: 'tags' },
              description: 'z.B. Gesundheit, Gesellschaft, Geld. Erscheinen neben dem Titel.',
            }),
            defineField({
              name: 'topic',
              title: 'Das Thema',
              type: 'text',
              rows: 3,
              description: 'Worum ging es, und warum lässt es sich nicht mit einem Foto zeigen?',
            }),
            defineField({ name: 'idea', title: 'Die Idee', type: 'text', rows: 3, description: 'Wie ist die Illustration an das Thema herangegangen?' }),
            defineField({ name: 'outcome', title: 'Was daraus wurde', type: 'text', rows: 3, description: 'Wirkung, Rückmeldung, Einsatz.' }),
            defineField({
              name: 'images',
              title: 'Bilder',
              type: 'array',
              of: [{ type: 'image', options: { hotspot: true } }],
              description: 'Das erste Bild ist das grosse. Drei bis fünf Bilder reichen.',
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'client', media: 'images.0' } },
        },
      ],
    }),
    defineField({
      name: 'testimonials',
      group: 'proof',
      title: 'Kundenstimmen',
      type: 'array',
      description: 'Nur echte Zitate, mit Erlaubnis der Person.',
      of: [
        {
          type: 'object',
          name: 'testimonial',
          fields: [
            defineField({ name: 'quote', title: 'Zitat', type: 'text', rows: 4, validation: (rule) => rule.required() }),
            defineField({ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'role', title: 'Rolle / Kunde', type: 'string', description: 'z.B. Redaktionsleiterin, Tsüri.ch' }),
          ],
          preview: { select: { title: 'name', subtitle: 'quote' } },
        },
      ],
    }),

    defineField({
      name: 'configImages',
      group: 'konfigurator',
      title: 'Illustrationen für die Auswahl',
      type: 'array',
      description:
        'Zu jeder Antwort im Projekt-Konfigurator kann Armanda eine eigene Illustration hinterlegen. Hochformat (4:5) passt am besten. Fehlt eine, erscheint ein Platzhalterbild.',
      of: [
        {
          type: 'object',
          name: 'configImage',
          fields: [
            defineField({ name: 'option', title: 'Für welche Antwort?', type: 'string', options: { list: optionList }, validation: (rule) => rule.required() }),
            defineField({ name: 'image', title: 'Illustration', type: 'image', options: { hotspot: true }, validation: (rule) => rule.required() }),
          ],
          preview: { select: { title: 'option', media: 'image' } },
        },
      ],
    }),
    defineField({
      name: 'process',
      group: 'ablauf',
      title: 'Ablauf der Zusammenarbeit',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'processStep',
          fields: [
            defineField({ name: 'title', title: 'Schritt', type: 'string' }),
            defineField({ name: 'text', title: 'Beschreibung', type: 'text', rows: 2 }),
            defineField({ name: 'duration', title: 'Dauer (kurz)', type: 'string', description: 'z.B. "wenige Tage"' }),
            defineField({
              name: 'image',
              title: 'Bild zum Schritt (optional)',
              type: 'image',
              options: { hotspot: true },
              description: 'Erscheint, wenn man den Schritt anklickt.',
            }),
            defineField({
              name: 'video',
              title: 'Video zum Schritt (optional)',
              type: 'file',
              options: { accept: 'video/*' },
              description: 'Kurzer, stummer Clip, z.B. Zeichnen im Zeitraffer. MP4 (H.264), möglichst unter 6 MB. Hat Vorrang vor dem Bild.',
            }),
          ],
          preview: { select: { title: 'title', subtitle: 'duration' } },
        },
      ],
    }),
    defineField({
      name: 'faq',
      group: 'ablauf',
      title: 'Häufige Fragen',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({ name: 'question', title: 'Frage', type: 'string' }),
            defineField({ name: 'answer', title: 'Antwort', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'question' } },
        },
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Illustration — Seite' }) },
})
