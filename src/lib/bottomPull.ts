// Gemeinsamer Zustand für die "Zieh dich zu den Werken"-Geste am Ende der
// Info-Seite. Ein einziger Satz window-Listener (lazy initialisiert bei der
// ersten Subscription) verfolgt den Finger durchgehend: solange normal
// gescrollt werden kann, passiert nichts; sobald der Rand erreicht ist,
// fliesst jede weitere Fingerbewegung direkt in die "pull"-Distanz, die den
// Fächer öffnet — ganz ohne eine neue Geste beginnen zu müssen. Lässt man
// vor der Schwelle los, federt der Fächer (über CSS-Transition in den
// Lesern) einfach zurück; das ist der gewünschte "Bounce".

export type BottomPullState = {
  pull: number // wie weit über den unteren Rand hinaus gezogen wurde (px)
  tensioned: boolean
  dragging: boolean // true während der Finger aktiv Pull-Distanz aufbaut
}

export const DRAG_THRESHOLD = 170

let state: BottomPullState = { pull: 0, tensioned: false, dragging: false }
const listeners = new Set<() => void>()
let initialized = false
let navigateCallback: (() => void) | null = null

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
  return () => listeners.delete(listener)
}

export function setBottomPullNavigate(cb: (() => void) | null) {
  navigateCallback = cb
}

function ensureInit() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  let lastTouchY: number | null = null
  let navigated = false

  function checkAtBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
  }

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

    if (pull >= DRAG_THRESHOLD && !navigated) {
      navigated = true
      navigateCallback?.()
    }
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
