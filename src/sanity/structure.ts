import type { StructureResolver } from 'sanity/structure'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Inhalt')
    .items([
      S.listItem()
        .title('Werke')
        .child(
          S.documentTypeList('artwork').title('Werke').defaultOrdering([
            { field: 'order', direction: 'asc' },
          ])
        ),
      S.divider(),
      S.listItem()
        .title('Info-Seite')
        .id('about-singleton')
        .child(S.document().schemaType('about').documentId('about-singleton')),
      S.listItem()
        .title('Site-Einstellungen')
        .id('siteSettings-singleton')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings-singleton')
        ),
    ])
