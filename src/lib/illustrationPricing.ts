// Preislogik des Illustrations-Konfigurators.
//
// ACHTUNG: Alle Zahlen sind PLATZHALTER, bis Armanda echte Werte aus früheren
// Aufträgen liefert. Absichtlich im Code und nicht im CMS, damit die Logik nur
// bewusst (durch uns) geändert wird. Das Ergebnis ist immer eine grobe
// Spanne und nie ein Angebot.

export type Option = { id: string; label: string; hint?: string }

export const PROJECT_TYPES: (Option & { min: number; max: number })[] = [
  { id: 'plakat', label: 'Plakat oder Kampagne', hint: 'Ein Motiv, das auffällt', min: 600, max: 1200 },
  { id: 'editorial', label: 'Zeitung oder Magazin', hint: 'Bild zu einem Text', min: 350, max: 800 },
  { id: 'verpackung', label: 'Verpackung oder Produkt', hint: 'Etikett, Box, Merch', min: 800, max: 1800 },
  { id: 'buch', label: 'Buch oder Cover', hint: 'Titelbild oder Innenseiten', min: 700, max: 1500 },
  { id: 'marke', label: 'Bildwelt für eine Marke', hint: 'Wiedererkennbarer Look', min: 900, max: 2000 },
  { id: 'anderes', label: 'Etwas anderes', hint: 'Erzähl mir davon', min: 500, max: 1500 },
]

export const MOTIF_COUNTS: (Option & { factor: number })[] = [
  { id: '1', label: 'Ein Motiv', factor: 1 },
  { id: '2-3', label: '2 bis 3 Motive', factor: 2.2 },
  { id: '4-6', label: '4 bis 6 Motive', factor: 3.8 },
  { id: '7+', label: 'Mehr als 6', hint: 'Serie oder Set', factor: 6 },
]

export const EFFORTS: (Option & { factor: number })[] = [
  { id: 'reduziert', label: 'Reduziert', hint: 'Klare Formen, wenig Detail', factor: 0.8 },
  { id: 'ausgearbeitet', label: 'Ausgearbeitet', hint: 'Mehr Fläche, Farbe und Detail', factor: 1 },
  { id: 'detailreich', label: 'Detailreich', hint: 'Dichte, aufwendige Szenen', factor: 1.5 },
]

export const USAGES: (Option & { factor: number })[] = [
  { id: 'lokal', label: 'Lokal und klein', hint: 'Kleine Auflage, ein Ort', factor: 0.9 },
  { id: 'print', label: 'Print, mehrere Orte', hint: 'Druck in der Schweiz', factor: 1 },
  { id: 'digital', label: 'Digital und Social Media', hint: 'Web, Newsletter, Social', factor: 1 },
  { id: 'kampagne', label: 'Grosse Kampagne', hint: 'Breite Streuung, Medien', factor: 1.4 },
  { id: 'produkt', label: 'Auf Produkten', hint: 'Verpackung, Verkauf, Merch', factor: 1.5 },
]

export const DEADLINES: (Option & { factor: number })[] = [
  { id: 'flexibel', label: 'Ich habe Zeit', hint: 'Mehr als 6 Wochen', factor: 0.95 },
  { id: 'normal', label: 'In 3 bis 6 Wochen', factor: 1 },
  { id: 'knapp', label: 'Es eilt', hint: 'Weniger als 3 Wochen', factor: 1.3 },
]

export type Selection = { type: string; motifs: string; effort: string; usage: string; deadline: string }

const roundTo = (value: number, step: number) => Math.round(value / step) * step

export function estimate(selection: Selection): { min: number; max: number } | null {
  const type = PROJECT_TYPES.find((o) => o.id === selection.type)
  const motifs = MOTIF_COUNTS.find((o) => o.id === selection.motifs)
  const effort = EFFORTS.find((o) => o.id === selection.effort)
  const usage = USAGES.find((o) => o.id === selection.usage)
  const deadline = DEADLINES.find((o) => o.id === selection.deadline)
  if (!type || !motifs || !effort || !usage || !deadline) return null
  const factor = motifs.factor * effort.factor * usage.factor * deadline.factor
  return { min: roundTo(type.min * factor, 50), max: roundTo(type.max * factor, 50) }
}

export function formatChf(value: number) {
  return `CHF ${value.toLocaleString('de-CH')}`
}

export function describeSelection(selection: Selection) {
  const label = (list: Option[], id: string) => list.find((o) => o.id === id)?.label ?? id
  return {
    Projekt: label(PROJECT_TYPES, selection.type),
    Umfang: label(MOTIF_COUNTS, selection.motifs),
    Aufwand: label(EFFORTS, selection.effort),
    Nutzung: label(USAGES, selection.usage),
    Termin: label(DEADLINES, selection.deadline),
  }
}
