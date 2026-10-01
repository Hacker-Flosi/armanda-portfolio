'use client'

import { PullFan, type PullFanItem } from '@/components/PullFan'

export type FanWork = PullFanItem

export function WorksFan({ works }: { works: FanWork[] }) {
  return <PullFan items={works} href="/" />
}
