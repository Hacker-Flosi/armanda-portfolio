import type { StructureResolver } from 'sanity/structure'

const DESIGN_ABOUT_ID = 'e2c806f9-f60e-45e8-87ba-c392ea7b049d'

const byOrder = [{ field: 'order', direction: 'asc' as const }]

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Inhalt')
    .items([
      S.listItem()
        .title('Kunst — Werke')
        .child(S.documentTypeList('artwork').title('Werke').defaultOrdering(byOrder)),
      S.listItem()
        .title('Kunst — Info-Seite')
        .id('about-singleton')
        .child(S.document().schemaType('about').documentId('about-singleton')),
      S.divider(),
      S.listItem()
        .title('Grafikdesign — Info & Startseite')
        .id('designAbout-singleton')
        .child(S.document().schemaType('designAbout').documentId(DESIGN_ABOUT_ID)),
      S.listItem()
        .title('Grafikdesign — Projekte')
        .child(S.documentTypeList('designWork').title('Projekte').defaultOrdering(byOrder)),
      S.listItem()
        .title('Grafikdesign — Kunden-Zeitstrahl (z.B. Tsüri.ch)')
        .child(S.documentTypeList('designTimeline').title('Kunden-Zeitstrahl').defaultOrdering(byOrder)),
      S.listItem()
        .title('Grafikdesign — Spielwiese')
        .child(S.documentTypeList('designPlay').title('Spielwiese').defaultOrdering(byOrder)),
      S.listItem()
        .title('Grafikdesign — Abseits der Arbeit (Fotos & Platten)')
        .child(S.documentTypeList('designInterest').title('Fotos & Platten').defaultOrdering(byOrder)),
      S.divider(),
      S.listItem()
        .title('Site-Einstellungen')
        .id('siteSettings-singleton')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings-singleton')),
    ])
