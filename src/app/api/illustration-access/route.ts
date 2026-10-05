import { ACCESS_COOKIE, accessToken, passwordMatches } from '@/lib/illustrationAccess'

const MAX_ATTEMPTS = 8
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
  return entry.count > MAX_ATTEMPTS
}

// Zugang zur Illustrations-Seite: bei richtigem Passwort wird ein Cookie
// gesetzt, mit dem die Seite danach ausgeliefert wird.
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (tooMany(ip)) return Response.json({ error: 'too-many-attempts' }, { status: 429 })

  let password = ''
  try {
    password = String(((await request.json()) as { password?: string }).password ?? '')
  } catch {
    return Response.json({ error: 'invalid' }, { status: 400 })
  }
  if (!password || password.length > 200 || !passwordMatches(password)) {
    return Response.json({ error: 'wrong-password' }, { status: 401 })
  }

  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `${ACCESS_COOKIE}=${accessToken()}; Path=/; Max-Age=${60 * 60 * 24 * 30}; HttpOnly; SameSite=Lax${secure}`,
    },
  })
}
