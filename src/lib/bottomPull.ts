// Gemeinsamer Zustand für die "Zieh dich zu den Werken"-Geste am Ende der
// Info-Seite. Ein einziger Satz window-Listener (lazy initialisiert bei der
// ersten Subscription) treibt sowohl den Fächer (öffnet sich mit dem Zug)
// als auch den elastischen Seiten-Bounce an — beide lesen denselben Zustand
// über useSyncExternalStore, ohne Props über die Server/Client-Grenze reichen
// zu müssen.

export type BottomPullState = {
  dragY: number // rohe Zugdistanz in px, treibt den Fächer
  elastic: number // gedämpfte Distanz für den Gummiband-Bounce des Inhalts
  tensioned: boolean
  dragging: boolean // true während der Finger aktiv am unteren Rand zieht
}

export const DRAG_THRESHOLD = 170
const ELASTIC_MAX = 64

function rubberBand(distance: number, max: number) {
  return max * (1 - Math.exp(-distance / max))
}

let state: BottomPullState = { dragY: 0, elastic: 0, tensioned: false, dragging: false }
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

  let atBottom = false
  let dragStartY: number | null = null
  let navigated = false

  function checkAtBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
  }

  function onScroll() {
    const bottom = checkAtBottom()
    if (bottom && !atBottom && dragStartY === null) {
      // Per Schwung (ohne gehaltenen Finger) am Ende angekommen -> kurzer
      // Bounce als Feedback, ohne den Fächer zu öffnen oder zu navigieren.
      // Kein Geschwindigkeits-Check mehr: mobile Browser drosseln/bündeln
      // Scroll-Events beim Momentum-Scrollen zu unterschiedlich, um die
      // Geschwindigkeit verlässlich zu messen.
      setState({ elastic: 22 })
      setTimeout(() => setState({ elastic: 0 }), 170)
    }
    atBottom = bottom
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)

  function onTouchStart(e: TouchEvent) {
    if (!atBottom) return
    dragStartY = e.touches[0].clientY
    setState({ dragging: true })
  }

  function onTouchMove(e: TouchEvent) {
    if (dragStartY === null) return
    if (!atBottom) {
      dragStartY = null
      setState({ dragY: 0, elastic: 0, tensioned: false, dragging: false })
      return
    }
    const dy = Math.max(0, dragStartY - e.touches[0].clientY)
    const tensioned = dy / DRAG_THRESHOLD > 0.85
    setState({ dragY: dy, elastic: rubberBand(dy, ELASTIC_MAX), tensioned, dragging: true })
    if (dy >= DRAG_THRESHOLD && !navigated) {
      navigated = true
      navigateCallback?.()
    }
  }

  function onTouchEnd() {
    dragStartY = null
    if (!navigated) setState({ dragY: 0, elastic: 0, tensioned: false, dragging: false })
  }

  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd, { passive: true })
}
