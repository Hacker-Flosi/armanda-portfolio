import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site-Einstellungen',
  type: 'document',
  fields: [
    defineField({
      name: 'availability',
      title: 'Verfügbarkeit',
      type: 'string',
      description:
        'Erscheint im Header der Grafikseite und auf der Info-Seite, z.B. "Verfügbar Oktober 26". Leer lassen blendet den Hinweis aus.',
      initialValue: 'Verfügbar Oktober 26',
    }),
    defineField({ name: 'mailAddress', title: 'Mail-Adresse', type: 'string' }),
    defineField({ name: 'mailSubject', title: 'Mail-Betreff', type: 'string' }),
    defineField({ name: 'instagramUrl', title: 'Instagram-URL', type: 'url' }),
    defineField({
      name: 'cvFile',
      title: 'Lebenslauf / Portfolio (PDF)',
      type: 'file',
      options: { accept: 'application/pdf' },
      description: 'Erscheint im Header des Grafikdesign-Portfolios als "CV".',
    }),
    defineField({ name: 'printsUrl', title: 'Prints-URL (extern)', type: 'url' }),
    defineField({
      name: 'designUrl',
      title: 'Grafikdesign-Portfolio-URL',
      type: 'url',
      description:
        'Link im Impressum zum Grafikdesign-Portfolio (Subdomain). Leer lassen, bis die Subdomain live ist.',
    }),
    defineField({
      name: 'impressumCredits',
      title: 'Impressum / Credits',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'credit',
          fields: [
            defineField({ name: 'role', title: 'Rolle', type: 'string' }),
            defineField({ name: 'name', title: 'Name', type: 'string' }),
          ],
        },
      ],
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site-Einstellungen' }),
  },
})
