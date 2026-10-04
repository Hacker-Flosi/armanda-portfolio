import { useState } from 'react'
import { useClient } from 'sanity'
import { apiVersion } from '../env'

type Row = { url: string; status: 'wartet' | 'läuft' | 'ok' | 'doppelt' | 'fehler'; label?: string; cover?: string }

const ALBUM = /https:\/\/open\.spotify\.com\/(?:intl-[a-z]+\/)?album\/([A-Za-z0-9]+)/g

// Studio-Werkzeug: mehrere Spotify-Album-Links auf einmal einfügen — jedes
// Album wird mit Titel, Interpret und Cover als Platte angelegt. Bereits
// vorhandene Alben werden übersprungen.
export function RecordImportTool() {
  const client = useClient({ apiVersion })
  const [text, setText] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)

  async function run() {
    const found = new Map<string, string>()
    for (const match of text.matchAll(ALBUM)) found.set(match[1], `https://open.spotify.com/album/${match[1]}`)
    if (found.size === 0) {
      setRows([])
      return
    }
    setBusy(true)
    const list: Row[] = Array.from(found.values()).map((url) => ({ url, status: 'wartet' }))
    setRows([...list])
    const update = (i: number, patch: Partial<Row>) => {
      list[i] = { ...list[i], ...patch }
      setRows([...list])
    }

    const existing: string[] = await client.fetch('*[_type == "designInterest" && defined(spotifyUrl)].spotifyUrl')
    const known = new Set(existing.map((u) => u.match(/album\/([A-Za-z0-9]+)/)?.[1]).filter(Boolean))
    const max: number | null = await client.fetch('math::max(*[_type == "designInterest"].order)')
    let order = (max ?? 0) + 10

    for (let i = 0; i < list.length; i++) {
      const id = list[i].url.split('/').pop() as string
      if (known.has(id)) {
        update(i, { status: 'doppelt', label: 'Ist schon in der Plattenkiste' })
        continue
      }
      update(i, { status: 'läuft' })
      try {
        const res = await fetch(`/api/spotify-meta?url=${encodeURIComponent(list[i].url)}`)
        if (!res.ok) throw new Error('nicht gefunden')
        const meta = (await res.json()) as { title: string; cover: string; artist?: string }
        await client.create({
          _type: 'designInterest',
          kind: 'platte',
          title: meta.title,
          artist: meta.artist,
          spotifyUrl: list[i].url,
          spotifyCover: meta.cover,
          order,
        })
        order += 10
        update(i, { status: 'ok', label: [meta.title, meta.artist].filter(Boolean).join(' — '), cover: meta.cover })
      } catch {
        update(i, { status: 'fehler', label: 'Nicht gefunden — Link prüfen' })
      }
    }
    setBusy(false)
  }

  const [refreshMsg, setRefreshMsg] = useState('')

  // Bestehende Platten mit Spotify-Link nachträglich mit Cover (und leeren
  // Titel-/Interpreten-Feldern) versorgen, damit die Übersicht sie zeigt.
  async function refreshExisting() {
    setBusy(true)
    setRefreshMsg('Aktualisiere …')
    const docs: { _id: string; spotifyUrl: string; title?: string; artist?: string }[] = await client.fetch(
      '*[_type == "designInterest" && defined(spotifyUrl) && !defined(spotifyCover) && !(_id in path("drafts.**"))]{ _id, spotifyUrl, title, artist }'
    )
    let count = 0
    for (const doc of docs) {
      try {
        const res = await fetch(`/api/spotify-meta?url=${encodeURIComponent(doc.spotifyUrl)}`)
        if (!res.ok) continue
        const meta = (await res.json()) as { title: string; cover: string; artist?: string }
        const set: Record<string, string> = { spotifyCover: meta.cover }
        if (!doc.title && meta.title) set.title = meta.title
        if (!doc.artist && meta.artist) set.artist = meta.artist
        await client.patch(doc._id).set(set).commit()
        count += 1
      } catch {
        // nächste Platte
      }
    }
    setRefreshMsg(docs.length === 0 ? 'Alle Platten sind schon aktuell.' : `${count} von ${docs.length} Platte(n) aktualisiert.`)
    setBusy(false)
  }

  const done = rows.filter((r) => r.status === 'ok').length
  const muted = { fontSize: 13, color: 'var(--card-muted-fg-color, #888)' } as const

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h1 style={{ fontSize: 22, margin: 0 }}>Platten-Import</h1>
      <p style={{ ...muted, margin: 0 }}>
        Mehrere Spotify-Album-Links einfügen (einer pro Zeile oder durch Leerzeichen getrennt). Jedes Album wird mit Titel, Interpret und Cover als
        Platte angelegt.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        disabled={busy}
        placeholder="https://open.spotify.com/album/…"
        style={{ width: '100%', padding: 12, borderRadius: 4, border: '1px solid var(--card-border-color, #ccc)', fontFamily: 'inherit', fontSize: 14 }}
      />
      <div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !text.trim()}
          style={{ padding: '10px 18px', borderRadius: 4, border: 0, cursor: busy ? 'default' : 'pointer', background: '#2276fc', color: '#fff', fontSize: 14, opacity: busy || !text.trim() ? 0.5 : 1 }}
        >
          {busy ? 'Importiere …' : 'Als Platten anlegen'}
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8, borderTop: '1px solid var(--card-border-color, #ddd)' }}>
        <button
          type="button"
          onClick={() => void refreshExisting()}
          disabled={busy}
          style={{ padding: '8px 14px', borderRadius: 4, border: '1px solid var(--card-border-color, #ccc)', background: 'transparent', color: 'inherit', cursor: busy ? 'default' : 'pointer', fontSize: 13 }}
        >
          Bestehende Platten aktualisieren
        </button>
        <span style={muted}>{refreshMsg || 'Holt Cover, Titel und Interpret für Platten, die schon angelegt sind.'}</span>
      </div>
      {rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rows.map((row) => (
            <div key={row.url} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 8, border: '1px solid var(--card-border-color, #ddd)', borderRadius: 4 }}>
              {row.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={row.cover} alt="" width={44} height={44} style={{ borderRadius: 3, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: 3, background: 'rgba(128,128,128,0.2)' }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 14 }}>{row.label ?? row.url}</span>
                <span style={muted}>
                  {{ wartet: 'Wartet …', läuft: 'Wird angelegt …', ok: 'Angelegt ✓', doppelt: 'Übersprungen', fehler: 'Fehler' }[row.status]}
                </span>
              </div>
            </div>
          ))}
          {!busy && done > 0 && <p style={{ margin: 0, fontSize: 14 }}>{done} Platte(n) angelegt. Du findest sie unter «Abseits der Arbeit».</p>}
        </div>
      )}
    </div>
  )
}
