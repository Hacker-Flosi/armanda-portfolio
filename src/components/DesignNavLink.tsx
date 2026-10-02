'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { MouseEvent, ReactNode } from 'react'
import { navigateWithFanTransition } from '@/lib/viewTransition'

// Link mit Seitenübergang (View Transition) zwischen Haupt- und Info-Seite
// des Grafikdesign-Portfolios. `variant` bestimmt die Richtung der Animation.
export function DesignNavLink({
  href,
  variant,
  className,
  children,
}: {
  href: string
  variant: 'up' | 'down'
  className?: string
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (pathname === href) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    e.preventDefault()
    navigateWithFanTransition(router, href, variant)
  }

  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  )
}
