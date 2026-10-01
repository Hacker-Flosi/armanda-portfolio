'use client'

import { PullFan } from '@/components/PullFan'

export function InfoFan({ src, alt }: { src: string; alt: string }) {
  return <PullFan items={[{ id: 'info-photo', src, alt, viewTransitionName: 'fan-info-photo' }]} href="/info" />
}
