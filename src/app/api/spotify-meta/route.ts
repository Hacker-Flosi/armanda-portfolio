import { getSpotifyMeta } from '@/lib/spotifyOembed'

// Metadaten zu einem Spotify-Link (Titel, Interpret, Cover) — vom Studio
// genutzt, um beim Einfügen eines Links die Felder auszufüllen.
export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url')
  const meta = await getSpotifyMeta(url)
  if (!meta) return Response.json({ error: 'not-found' }, { status: 404 })
  return Response.json(meta, { headers: { 'Cache-Control': 'public, max-age=3600' } })
}
