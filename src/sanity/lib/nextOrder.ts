// Vorbelegung für das Feld "Reihenfolge": neue Einträge landen automatisch am
// Ende der Liste (höchste bisherige Zahl + 10). Armanda muss nichts eintippen
// und kann die Zahl nur bei Bedarf anpassen.
export function nextOrder(type: string) {
  return async (_params: unknown, context: { getClient: (options: { apiVersion: string }) => { fetch: (query: string, params: Record<string, unknown>) => Promise<number | null> } }) => {
    const client = context.getClient({ apiVersion: '2024-01-01' })
    const max = await client.fetch('math::max(*[_type == $type].order)', { type })
    return (max ?? 0) + 10
  }
}
