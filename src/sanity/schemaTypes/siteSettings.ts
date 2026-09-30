import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site-Einstellungen',
  type: 'document',
  fields: [
    defineField({ name: 'mailAddress', title: 'Mail-Adresse', type: 'string' }),
    defineField({ name: 'mailSubject', title: 'Mail-Betreff', type: 'string' }),
    defineField({ name: 'instagramUrl', title: 'Instagram-URL', type: 'url' }),
    defineField({ name: 'printsUrl', title: 'Prints-URL (extern)', type: 'url' }),
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
