import { createHash, timingSafeEqual } from 'node:crypto'

export const ACCESS_COOKIE = 'illustration-access'

// Passwort der Illustrations-Seite (solange sie in der Konzeptphase ist).
// Bevorzugt aus der Umgebungsvariable ILLUSTRATION_PASSWORD; ohne sie gilt der
// Vorgabewert. Das Repository ist öffentlich — für echten Schutz die Variable
// auf Vercel setzen.
function expectedPassword() {
  return process.env.ILLUSTRATION_PASSWORD || 'AA'
}

const sha = (value: string) => createHash('sha256').update(value).digest()

// Wert des Zugangs-Cookies: Hash aus Passwort, damit eine Änderung des
// Passworts alle bisherigen Zugänge ungültig macht.
export function accessToken() {
  return sha(`illustration-access:${expectedPassword()}`).toString('hex')
}

export function passwordMatches(input: string) {
  return timingSafeEqual(sha(input.trim()), sha(expectedPassword()))
}

export function tokenValid(token?: string) {
  if (!token) return false
  const expected = Buffer.from(accessToken())
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}
