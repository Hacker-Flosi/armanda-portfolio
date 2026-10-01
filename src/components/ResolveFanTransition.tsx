'use client'

import { useEffect } from 'react'
import { resolvePendingFanTransition } from '@/lib/viewTransition'

export function ResolveFanTransition() {
  useEffect(() => {
    resolvePendingFanTransition()
  }, [])
  return null
}
