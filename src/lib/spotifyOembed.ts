// Holt Titel und Cover eines Spotify-Links über Spotifys öffentliche
// oEmbed-Schnittstelle (ohne Zugangsdaten). Bei jedem Fehler null.
export type SpotifyMeta = { title: string; cover: string }

export async function getSpotifyMeta(url?: string | null): Promise<SpotifyMeta | null> {
  if (!url) return null
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url.split('?')[0])}`, {
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { title?: string; thumbnail_url?: string }
    if (!json.thumbnail_url) return null
    return { title: json.title ?? '', cover: json.thumbnail_url }
  } catch {
    return null
  }
}
