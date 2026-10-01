// Brückt eine client-seitige Next.js-Navigation mit der View-Transition-API, damit
// Elemente mit demselben `viewTransitionName` auf der alten und neuen Seite sauber
// ineinander übergehen, statt die Seite hart zu wechseln.

type Router = { push: (href: string) => void }

let pendingResolve: (() => void) | null = null

type DocumentWithViewTransitions = Document & {
  startViewTransition?: (callback: () => Promise<void> | void) => void
}

export function navigateWithFanTransition(router: Router, href: string) {
  const doc = document as DocumentWithViewTransitions
  if (typeof doc.startViewTransition !== 'function') {
    router.push(href)
    return
  }

  doc.startViewTransition(() => {
    return new Promise<void>((resolve) => {
      pendingResolve = resolve
      router.push(href)
    })
  })
}

// Wird von der Zielseite aufgerufen, sobald sie gemountet ist, damit die
// View-Transition den "Nachher"-Zustand einfangen und abspielen kann.
export function resolvePendingFanTransition() {
  pendingResolve?.()
  pendingResolve = null
}
