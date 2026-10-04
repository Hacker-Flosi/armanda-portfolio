// Holt Titel, Interpret und Cover eines Spotify-Links ohne Zugangsdaten:
// Titel und Cover über Spotifys öffentliche oEmbed-Schnittstelle, den
// Interpreten aus der öffentlichen Embed-Seite des Albums. Jede Quelle darf
// einzeln ausfallen; ohne brauchbares Cover gibt es null.
export type SpotifyMeta = { title: string; cover: string; artist?: string }

const SPOTIFY_URL = /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]+\/)?(album|track|playlist)\/([A-Za-z0-9]+)/

async function fetchArtist(kind: string, id: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://open.spotify.com/embed/${kind}/${id}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return undefined
    const html = await res.text()
    const match = html.match(/id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/)
    if (!match) return undefined
    const entity = JSON.parse(match[1])?.props?.pageProps?.state?.data?.entity as { subtitle?: string } | undefined
    return entity?.subtitle || undefined
  } catch {
    return undefined
  }
}

export async function getSpotifyMeta(url?: string | null): Promise<SpotifyMeta | null> {
  const match = url?.match(SPOTIFY_URL)
  if (!match) return null
  const [, kind, id] = match
  try {
    const [res, artist] = await Promise.all([
      fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(`https://open.spotify.com/${kind}/${id}`)}`, {
        next: { revalidate: 86400 },
      }),
      kind === 'playlist' ? Promise.resolve(undefined) : fetchArtist(kind, id),
    ])
    if (!res.ok) return null
    const json = (await res.json()) as { title?: string; thumbnail_url?: string }
    if (!json.thumbnail_url) return null
    return { title: json.title ?? '', cover: json.thumbnail_url, artist }
  } catch {
    return null
  }
}
