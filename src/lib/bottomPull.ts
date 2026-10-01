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

let state: BottomPullState = { pull: 0, tensioned: false, dragging: false }
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
  navigated = false
  lastTouchY = null
  setState({ pull: 0, tensioned: false, dragging: false })
}

export function setBottomPullNavigate(cb: (() => void) | null) {
  navigateCallback = cb
}

function checkAtBottom() {
  return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
}

function triggerNavigate() {
  if (navigated) return
  navigated = true
  navigateCallback?.()
}

function ensureInit() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  function onTouchStart(e: TouchEvent) {
    lastTouchY = e.touches[0].clientY
  }

  function onTouchMove(e: TouchEvent) {
    if (lastTouchY === null) return
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

  if (bottom && !lastAtBottom && lastTouchY === null && !navigated && velocity <= MAX_PLAUSIBLE_FRAME_DELTA) {
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
