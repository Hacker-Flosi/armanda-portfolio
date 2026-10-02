import { createHash, timingSafeEqual } from 'node:crypto'
import { getSiteSettings } from '@/sanity/lib/queries'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 10 * 60 * 1000
const attempts = new Map<string, { count: number; resetAt: number }>()

function sha256(value: string) {
  return createHash('sha256').update(value).digest()
}

function tooManyAttempts(ip: string) {
  const now = Date.now()
  const entry = attempts.get(ip)
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_ATTEMPTS
}

// Passwortgeschützter CV-Download: die Datei-URL verlässt den Server nie, das
// PDF wird erst nach korrektem Passwort durchgereicht.
export async function POST(request: Request) {
  const expected = process.env.CV_PASSWORD
  if (!expected) return Response.json({ error: 'not-configured' }, { status: 503 })

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (tooManyAttempts(ip)) return Response.json({ error: 'too-many-attempts' }, { status: 429 })

  const body = (await request.json().catch(() => null)) as { password?: unknown } | null
  const password = typeof body?.password === 'string' ? body.password : ''
  if (!timingSafeEqual(sha256(password), sha256(expected))) {
    return Response.json({ error: 'wrong-password' }, { status: 401 })
  }

  const settings = await getSiteSettings()
  if (!settings?.cvUrl) return Response.json({ error: 'no-file' }, { status: 404 })

  const upstream = await fetch(settings.cvUrl, { cache: 'no-store' })
  if (!upstream.ok || !upstream.body) return Response.json({ error: 'upstream' }, { status: 502 })

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="Armanda-Asani-CV.pdf"',
      'Cache-Control': 'no-store',
    },
  })
}
