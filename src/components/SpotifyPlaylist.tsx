'use client'

import { useState } from 'react'

export function playlistIdFrom(url?: string | null): string | null {
  const match = url?.match(/playlist[/:]([A-Za-z0-9]+)/)
  return match ? match[1] : null
}

// Eingebetteter Spotify-Player. Er wird erst nach einem Klick geladen, damit
// ohne Zutun keine Daten an Spotify übertragen werden.
export function SpotifyPlaylist({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false)
  const id = playlistIdFrom(url)
  if (!id) return null

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex flex-col gap-1">
        <span className="font-medium" style={{ fontSize: 'clamp(1.5rem, 1rem + 2vw, 2.75rem)', letterSpacing: '-0.03em' }}>
          Was bei mir läuft
        </span>
        <span className="text-[var(--ink-muted)]">Meine Playlist — zum Reinhören, während du dich umschaust.</span>
      </div>

      {loaded ? (
        <iframe
          title="Spotify-Playlist"
          src={`https://open.spotify.com/embed/playlist/${id}?theme=0`}
          width="100%"
          height="452"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="archive-tile rounded-xl border-0"
        />
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setLoaded(true)}
            className="self-start h-12 px-6 rounded-full bg-[var(--ink)] text-[var(--bg)] font-medium cursor-pointer"
          >
            Playlist laden ▶
          </button>
          <span className="text-xs text-[var(--ink-muted)]">
            Beim Laden werden Daten an Spotify übertragen.{' '}
            <a href={url} target="_blank" rel="noreferrer" className="underline underline-offset-4">
              Oder direkt in Spotify öffnen ↗
            </a>
          </span>
        </div>
      )}
    </div>
  )
}
