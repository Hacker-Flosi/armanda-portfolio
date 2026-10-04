import { useEffect, useState } from 'react'
import { useDocumentOperation, useFormValue } from 'sanity'
import type { StringInputProps } from 'sanity'

type Meta = { title: string; cover: string; artist?: string }

// Eingabefeld für Spotify-Links im Studio: holt beim Einfügen Titel, Interpret
// und Cover, zeigt sie als Vorschau und trägt Titel und Interpret in die
// leeren Felder ein (bereits Ausgefülltes wird nie überschrieben).
export function SpotifyUrlInput(props: StringInputProps) {
  const url = typeof props.value === 'string' ? props.value : ''
  const rawId = (useFormValue(['_id']) as string | undefined) ?? ''
  const publishedId = rawId.replace(/^drafts\./, '')
  const title = useFormValue(['title']) as string | undefined
  const artist = useFormValue(['artist']) as string | undefined
  const { patch } = useDocumentOperation(publishedId, 'designInterest')
  const isSpotifyUrl = /open\.spotify\.com\//.test(url)
  const [fetched, setMeta] = useState<Meta | null>(null)
  const meta = isSpotifyUrl ? fetched : null
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle')

  useEffect(() => {
    if (!isSpotifyUrl) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setState('loading')
      try {
        const res = await fetch(`/api/spotify-meta?url=${encodeURIComponent(url)}`)
        if (!res.ok) throw new Error('not found')
        const data = (await res.json()) as Meta
        if (cancelled) return
        setMeta(data)
        setState('idle')
      } catch {
        if (!cancelled) {
          setMeta(null)
          setState('error')
        }
      }
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [url, isSpotifyUrl])

  // Leere Felder einmal automatisch füllen, sobald Metadaten vorliegen.
  useEffect(() => {
    if (!meta || !patch.execute || patch.disabled) return
    const set: Record<string, string> = {}
    if (!title && meta.title) set.title = meta.title
    if (!artist && meta.artist) set.artist = meta.artist
    if (Object.keys(set).length > 0) patch.execute([{ set }])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta])

  const muted = { fontSize: 13, color: 'var(--card-muted-fg-color, #888)' } as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {props.renderDefault(props)}
      {isSpotifyUrl && state === 'loading' && <span style={muted}>Lade Albuminfos von Spotify …</span>}
      {isSpotifyUrl && state === 'error' && (
        <span style={muted}>Zu diesem Link konnte nichts gefunden werden. Bitte den Album-Link aus Spotify neu kopieren.</span>
      )}
      {meta && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            padding: 12,
            borderRadius: 4,
            border: '1px solid var(--card-border-color, #ccc)',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={meta.cover} alt="" width={72} height={72} style={{ borderRadius: 4, objectFit: 'cover' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <strong style={{ fontSize: 14 }}>{meta.title}</strong>
            {meta.artist && <span style={{ fontSize: 13 }}>{meta.artist}</span>}
            <span style={muted}>
              So erscheint die Platte auf der Seite. Titel und Interpret oben wurden automatisch ergänzt (falls leer).
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
