// Gemeinsamer Zustand für die "Zieh dich zu den Werken"-Geste am Ende der
// Info-Seite.
//
// Zwei Wege führen zum selben "pull"-Wert, der den Fächer öffnet:
//
// 1) Aktives Ziehen: Sobald normal nicht mehr weiter gescrollt werden kann,
//    fliesst jede weitere Fingerbewegung (touchmove) direkt in "pull" —
//    ganz ohne eine neue Geste beginnen zu müssen.
// 2) Schwung/Momentum: Scrollt man schnell und schiesst über das Ende
//    hinaus (native Momentum-/Rubber-Band-Physik, Finger meist schon oben),
//    misst eine rAF-Schleife die Geschwindigkeit, mit der der untere Rand
//    erreicht wird, und übersetzt sie direkt in einen Fächer-Ausschlag:
//    leichter Schwung → kurzer Ausschlag, der zurückfedert; starker
//    Schwung → reicht bis zur Schwelle und löst die Transition direkt aus.
//
// Beide Wege schliessen sich gegenseitig aus (der Momentum-Pfad greift nur,
// wenn gerade kein Finger aktiv auf dem Bildschirm ist).

export type BottomPullState = {
  pull: number // wie weit über den unteren Rand hinaus gezogen wurde (px)
  tensioned: boolean
  dragging: boolean // true während der Finger aktiv Pull-Distanz aufbaut
  aligned: boolean // Fächer richtet sich vor dem Seitenwechsel gerade (ohne Drehung) aus
}

export const DRAG_THRESHOLD = 170

const MIN_IMPULSE = 12 // kleinere Ankünfte am Rand werden ignoriert
const MAX_IMPULSE = 260
// px Fächer-Ausschlag pro px/Frame Scroll-Geschwindigkeit. Niedrig gehalten,
// damit ein normaler, auch zügiger Scroll bis ganz nach unten nur einen
// Ausschlag (Bounce) gibt — erst ein wirklich harter Flick (~45+ px/Frame)
// erreicht die Schwelle und verlässt die Seite direkt.
const VELOCITY_SCALE = 3.5
const IMPULSE_HOLD_MS = 220 // wie lange der Ausschlag sichtbar bleibt, bevor er zurückfedert
// Sprünge über diese Grösse sind kein echtes Scrollen (Seitenwechsel,
// Scroll-Restoration, Resize) und werden ignoriert, statt als extrem
// schneller Schwung gewertet zu werden.
const MAX_PLAUSIBLE_FRAME_DELTA = 120

let state: BottomPullState = { pull: 0, tensioned: false, dragging: false, aligned: false }
const listeners = new Set<() => void>()
let initialized = false
let navigateCallback: (() => void) | null = null
let navigated = false
let lastTouchY: number | null = null
let rafRunning = false

function emit() {
  for (const listener of listeners) listener()
}

function setState(partial: Partial<BottomPullState>) {
  state = { ...state, ...partial }
  emit()
}

export function getBottomPullState() {
  return state
}

export function subscribeBottomPull(listener: () => void) {
  listeners.add(listener)
  ensureInit()
  startVelocityLoop()
  return () => listeners.delete(listener)
}

// Wird beim Mounten der Fächer-Seite aufgerufen: setzt die Geste scharf,
// falls man schon einmal erfolgreich zu den Werken navigiert ist und jetzt
// (z.B. über "Zurück") wieder auf der Info-Seite landet. Ohne das bliebe
// "navigated" für immer true, da das Modul bei einer Client-Navigation
// nicht neu geladen wird — jeder weitere Versuch hätte dann einfach nichts
// mehr getan.
export function resetBottomPull() {
  delete document.documentElement.dataset.leaving
  navigated = false
  lastTouchY = null
  setState({ pull: 0, tensioned: false, dragging: false, aligned: false })
}

export function setBottomPullNavigate(cb: (() => void) | null) {
  navigateCallback = cb
}

function checkAtBottom() {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
}

// Der Fächer wird nur unterhalb von Tailwinds "sm"-Breakpoint angezeigt
// (sm:hidden) — ohne diese Prüfung konnte schnelles Mausrad-/Trackpad-
// Scrollen auf dem Desktop denselben Schwung-Impuls auslösen und die Seite
// wechseln, obwohl dort gar kein Fächer zu sehen war.
const MOBILE_BREAKPOINT = 640
function isMobileViewport() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

// Abbau: bevor die Seite wechselt, fahren Fächer und alle Komponenten der
// Seite nacheinander heraus (von unten nach oben). Erst danach folgt die
// Navigation; die neue Seite baut sich selbst wieder auf.
const STAGGER_MS = 20
const MAX_STAGGER_MS = 140
const LEAVE_MS = 280

function dismantlePage() {
  const root = document.documentElement
  const targets = Array.from(document.querySelectorAll<HTMLElement>('.reveal, [data-reveal-line]'))
    .filter((el) => el.getBoundingClientRect().bottom > 0)
    .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)
  targets.forEach((el, i) => el.style.setProperty('--leave-delay', `${Math.min(MAX_STAGGER_MS, i * STAGGER_MS)}ms`))
  root.dataset.leaving = '1'
  return Math.min(MAX_STAGGER_MS, targets.length * STAGGER_MS) + LEAVE_MS
}

function triggerNavigate() {
  if (navigated) return
  navigated = true
  const wait = dismantlePage()
  setState({ pull: DRAG_THRESHOLD, tensioned: false, dragging: false, aligned: true })
  setTimeout(() => navigateCallback?.(), wait)
}

// Tippen auf den Fächer löst dieselbe Navigation aus wie Ziehen/Schwung: der
// Fächer klappt zuerst auf, dann folgt der Übergang.
export function activateBottomPull() {
  triggerNavigate()
}

function ensureInit() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  function onTouchStart(e: TouchEvent) {
    if (!isMobileViewport()) return
    lastTouchY = e.touches[0].clientY
  }

  function onTouchMove(e: TouchEvent) {
    if (lastTouchY === null || !isMobileViewport()) return
    const y = e.touches[0].clientY
    const delta = lastTouchY - y // positiv = Finger zieht nach oben = will weiter nach unten scrollen
    lastTouchY = y

    if (!checkAtBottom()) {
      if (state.pull !== 0) setState({ pull: 0, tensioned: false, dragging: false })
      return
    }

    const pull = Math.max(0, state.pull + delta)
    const tensioned = pull / DRAG_THRESHOLD > 0.85
    setState({ pull, tensioned, dragging: true })

    if (pull >= DRAG_THRESHOLD) triggerNavigate()
  }

  function onTouchEnd() {
    lastTouchY = null
    if (!navigated) setState({ pull: 0, tensioned: false, dragging: false })
  }

  // iOS übergibt eine Geste oft an die native Scroll-/Rubber-Band-Physik und
  // feuert dann 'touchcancel' statt 'touchend' — ohne diesen Handler blieb
  // der Zustand für immer auf "dragging" eingefroren und der Fächer federte
  // nie zurück.
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
  window.addEventListener('touchcancel', onTouchEnd, { passive: true })
}

let lastScrollY = 0
let lastAtBottom = false

function velocityFrame() {
  if (listeners.size === 0) {
    rafRunning = false
    return
  }

  const y = window.scrollY
  const velocity = y - lastScrollY // px seit dem letzten Frame, positiv = Richtung Seitenende
  const bottom = checkAtBottom()

  if (
    bottom &&
    !lastAtBottom &&
    lastTouchY === null &&
    !navigated &&
    velocity <= MAX_PLAUSIBLE_FRAME_DELTA &&
    isMobileViewport()
  ) {
    const impulse = Math.min(MAX_IMPULSE, Math.max(0, velocity) * VELOCITY_SCALE)
    if (impulse >= MIN_IMPULSE) {
      const tensioned = impulse / DRAG_THRESHOLD > 0.85
      setState({ pull: impulse, tensioned, dragging: false })

      if (impulse >= DRAG_THRESHOLD) {
        triggerNavigate()
      } else {
        setTimeout(() => {
          // Nicht zurücksetzen, falls der Nutzer in der Zwischenzeit selbst
          // zu ziehen begonnen hat.
          if (!navigated && lastTouchY === null) {
            setState({ pull: 0, tensioned: false, dragging: false })
          }
        }, IMPULSE_HOLD_MS)
      }
    }
  }

  lastAtBottom = bottom
  lastScrollY = y
  requestAnimationFrame(velocityFrame)
}

function startVelocityLoop() {
  if (rafRunning || typeof window === 'undefined') return
  rafRunning = true
  lastScrollY = window.scrollY
  lastAtBottom = checkAtBottom()
  requestAnimationFrame(velocityFrame)
}
