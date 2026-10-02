// Brückt eine client-seitige Next.js-Navigation mit der View-Transition-API, damit
// Elemente mit demselben `viewTransitionName` auf der alten und neuen Seite sauber
// ineinander übergehen, statt die Seite hart zu wechseln.

type Router = { push: (href: string) => void }

let pendingResolve: (() => void) | null = null

type DocumentWithViewTransitions = Document & {
  startViewTransition?: (callback: () => Promise<void> | void) => { finished: Promise<void> }
}

// `variant` setzt `data-transition` am <html>-Element, damit das CSS je nach
// Richtung unterschiedliche Seitenübergänge abspielen kann (z.B. "up"/"down").
export function navigateWithFanTransition(router: Router, href: string, variant?: string) {
  const doc = document as DocumentWithViewTransitions
  if (typeof doc.startViewTransition !== 'function') {
    router.push(href)
    return
  }

  const transition = doc.startViewTransition(() => {
    // Erst nach dem Einfangen des alten Zustands setzen, damit dessen
    // Darstellung unverändert bleibt.
    if (variant) document.documentElement.dataset.transition = variant
    delete document.documentElement.dataset.leaving
    return new Promise<void>((resolve) => {
      pendingResolve = resolve
      router.push(href)
      // Sicherheitsnetz, falls die Zielseite den Übergang nicht auflöst.
      window.setTimeout(() => {
        if (pendingResolve === resolve) {
          resolve()
          pendingResolve = null
        }
      }, 2000)
    })
  })
  void transition.finished.finally(() => {
    delete document.documentElement.dataset.transition
    delete document.documentElement.dataset.leaving
  })
}

// Wird von der Zielseite aufgerufen, sobald sie gemountet ist, damit die
// View-Transition den "Nachher"-Zustand einfangen und abspielen kann.
export function resolvePendingFanTransition() {
  pendingResolve?.()
  pendingResolve = null
}
