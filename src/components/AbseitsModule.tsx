'use client'

import { useState } from 'react'
import { PhotoStrip } from '@/components/PhotoStrip'
import type { PhotoItem } from '@/components/PhotoStrip'
import { RecordCrate } from '@/components/RecordCrate'
import { SpotifyPlaylist, playlistIdFrom } from '@/components/SpotifyPlaylist'
import type { RecordItem } from '@/components/RecordCrate'

// "Abseits der Arbeit": private Fotos, Plattenkiste und Spotify-Playlist, per
// Umschalter wählbar.
export function AbseitsModule({
  photos,
  records,
  playlistUrl,
}: {
  photos: PhotoItem[]
  records: RecordItem[]
  playlistUrl?: string
}) {
  const modes = [
    ...(photos.length > 0 ? [{ id: 'foto', label: 'Fotos', count: photos.length }] : []),
    ...(records.length > 0 ? [{ id: 'platte', label: 'Plattenkiste', count: records.length }] : []),
    ...(playlistIdFrom(playlistUrl) ? [{ id: 'playlist', label: 'Playlist', count: undefined as number | undefined }] : []),
  ]
  const [mode, setMode] = useState(modes[0]?.id ?? 'foto')
  if (modes.length === 0) return null

  return (
    <div className="flex flex-col gap-8">
      {modes.length > 1 && (
        <div role="tablist" className="flex gap-2">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={mode === m.id}
              onClick={() => setMode(m.id)}
              className="h-10 px-5 rounded-full border text-sm font-medium transition-colors duration-300 cursor-pointer"
              style={{
                borderColor: 'color-mix(in srgb, var(--ink) 35%, transparent)',
                background: mode === m.id ? 'var(--ink)' : 'transparent',
                color: mode === m.id ? 'var(--bg)' : 'var(--ink)',
              }}
            >
              {m.label} {m.count !== undefined && <span className="opacity-60">{m.count}</span>}
            </button>
          ))}
        </div>
      )}

      <div key={mode} className="archive-tile">
        {mode === 'foto' ? (
          <PhotoStrip photos={photos} />
        ) : mode === 'platte' ? (
          <RecordCrate records={records} />
        ) : (
          <SpotifyPlaylist url={playlistUrl ?? ''} />
        )}
      </div>
    </div>
  )
}
