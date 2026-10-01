'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import { useSyncExternalStore } from 'react'
import { useRouter } from 'next/navigation'
import { navigateWithFanTransition } from '@/lib/viewTransition'
import { getBottomPullState, setBottomPullNavigate, subscribeBottomPull } from '@/lib/bottomPull'

export function InfoEndInteraction({ className, children }: { className?: string; children: ReactNode }) {
  const router = useRouter()
  const mainRef = useRef<HTMLElement>(null)
  const { elastic, dragging } = useSyncExternalStore(subscribeBottomPull, getBottomPullState, getBottomPullState)

  useEffect(() => {
    setBottomPullNavigate(() => navigateWithFanTransition(router, '/'))
    return () => setBottomPullNavigate(null)
  }, [router])

  return (
    <main
      ref={mainRef}
      className={className}
      style={{
        transform: `translateY(${elastic}px)`,
        transition: dragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
      }}
    >
      {children}
    </main>
  )
}
