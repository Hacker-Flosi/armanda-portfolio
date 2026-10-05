import { getSiteSettings } from '@/sanity/lib/queries'

const MAX_REQUESTS = 5
const WINDOW_MS = 10 * 60 * 1000
const attempts = new Map<string, { count: number; resetAt: number }>()

function tooMany(ip: string) {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_REQUESTS
}

type Payload = {
  kind?: 'projekt' | 'rueckruf'
  name?: string
  email?: string
  phone?: string
  window?: string
  message?: string
  summary?: Record<string, string>
  estimate?: string
  consent?: boolean
  website?: string
}

const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

// Anfrage von der Illustrations-Seite (Projekt-Brief oder Rückrufwunsch):
// wird per E-Mail (Resend) an Armanda geschickt. Spam-Schutz: verstecktes
// Feld, Mengenbegrenzung pro IP, Pflichtfelder und Einwilligung.
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (tooMany(ip)) return Response.json({ error: 'too-many-requests' }, { status: 429 })

  let body: Payload
  try {
    body = (await request.json()) as Payload
  } catch {
    return Response.json({ error: 'invalid' }, { status: 400 })
  }

  // Honeypot: Bots füllen das versteckte Feld; wir tun so, als wäre es angekommen.
  if (body.website) return Response.json({ ok: true })

  const kind = body.kind === 'rueckruf' ? 'rueckruf' : 'projekt'
  const name = clean(body.name, 100)
  const email = clean(body.email, 200)
  const phone = clean(body.phone, 40)
  const window = clean(body.window, 80)
  const message = clean(body.message, 2000)
  const estimate = clean(body.estimate, 80)

  if (!name || body.consent !== true) return Response.json({ error: 'invalid' }, { status: 400 })
  if (kind === 'projekt' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({ error: 'invalid-email' }, { status: 400 })
  if (kind === 'rueckruf' && phone.replace(/\D/g, '').length < 6) return Response.json({ error: 'invalid-phone' }, { status: 400 })

  const summaryLines = Object.entries(body.summary ?? {})
    .slice(0, 10)
    .map(([key, value]) => `${clean(key, 40)}: ${clean(value, 120)}`)

  const lines: string[] = [kind === 'rueckruf' ? 'Neuer Rückrufwunsch' : 'Neue Projektanfrage', '', `Name: ${name}`]
  if (email) lines.push(`E-Mail: ${email}`)
  if (phone) lines.push(`Telefon: ${phone}`)
  if (window) lines.push(`Am besten erreichbar: ${window}`)
  if (summaryLines.length) {
    lines.push('', 'Zusammengestelltes Projekt:', ...summaryLines)
    if (estimate) lines.push(`Richtwert (Konfigurator): ${estimate}`)
  }
  if (message) lines.push('', 'Nachricht:', message)
  const text = lines.join('\n')

  const settings = await getSiteSettings()
  const to = process.env.INQUIRY_TO_EMAIL ?? settings?.mailAddress
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey || !to) {
    // Lokal ohne Mail-Zugang: Anfrage nur ins Log schreiben, damit sich der
    // Ablauf testen lässt. Live bedeutet das Fehler (kein stilles Verschlucken).
    if (process.env.NODE_ENV !== 'production') {
      console.log('[illustration-request] (Mailversand nicht eingerichtet)\n' + text)
      return Response.json({ ok: true, dev: true })
    }
    return Response.json({ error: 'not-configured' }, { status: 503 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.INQUIRY_FROM_EMAIL ?? 'Armanda Asani <onboarding@resend.dev>',
      to: [to],
      reply_to: email || undefined,
      subject: kind === 'rueckruf' ? `Rückrufwunsch von ${name}` : `Projektanfrage von ${name}`,
      text,
    }),
  })
  if (!res.ok) return Response.json({ error: 'send-failed' }, { status: 502 })
  return Response.json({ ok: true })
}
