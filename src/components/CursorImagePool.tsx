'use client'

import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import Image from 'next/image'

export type PoolImage = {
  src: string
  aspectRatio: number | null
}

type Spawn = {
  key: number
  x: number
  y: number
  size: number
  image: PoolImage
}

const MIN_SPAWN_DIST = 40
const MIN_SPAWN_INTERVAL_MS = 130
const MAX_CONCURRENT = 12
const LIFESPAN_MS = 1900

// Cursor-gesteuerter Bild-Pool — inspiriert von avecanni.studio: beim
// Bewegen des Cursors über die Fläche blenden zufällige Bilder aus einem
// gemeinsamen Pool in der Nähe des Cursors ein und wieder aus, mit Blur und
// Skalierung als Teil der Reveal-Bewegung. Eigenständige Komponente, noch
// ohne feste Platzierung — Testfläche, bis der endgültige Ort feststeht.
export function CursorImagePool({ pool }: { pool: PoolImage[] }) {
  const [spawns, setSpawns] = useState<Spawn[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const lastSpawnPos = useRef({ x: 0, y: 0 })
  const lastSpawnTime = useRef(0)
  const nextKey = useRef(0)
  const poolIndex = useRef(0)
  const reducedMotion = useRef(false)
  const timeouts = useRef<number[]>([])
  const activeCount = useRef(0)

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const timeoutsAtMount = timeouts.current
    return () => {
      timeoutsAtMount.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  function spawnAt(x: number, y: number) {
    // Bei Überlast lieber nichts Neues spawnen, als ein Bild hart zu entfernen —
    // so läuft jede Outro-Animation immer vollständig durch.
    if (pool.length === 0 || reducedMotion.current || activeCount.current >= MAX_CONCURRENT) return
    activeCount.current += 1
    const image = pool[poolIndex.current % pool.length]
    poolIndex.current += 1
    const key = nextKey.current++
    const jitterX = (Math.random() - 0.5) * 50
    const jitterY = (Math.random() - 0.5) * 50
    const size = 120 + Math.random() * 70
    setSpawns((prev) => [...prev, { key, x: x + jitterX, y: y + jitterY, size, image }])
    const timeoutId = window.setTimeout(() => {
      activeCount.current -= 1
      setSpawns((prev) => prev.filter((s) => s.key !== key))
    }, LIFESPAN_MS)
    timeouts.current.push(timeoutId)
  }

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const dx = x - lastSpawnPos.current.x
    const dy = y - lastSpawnPos.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const now = performance.now()
    if (dist > MIN_SPAWN_DIST && now - lastSpawnTime.current > MIN_SPAWN_INTERVAL_MS) {
      lastSpawnPos.current = { x, y }
      lastSpawnTime.current = now
      spawnAt(x, y)
    }
  }

  function handleMouseEnter(e: MouseEvent<HTMLDivElement>) {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    lastSpawnPos.current = { x, y }
    lastSpawnTime.current = 0
    spawnAt(x, y)
  }

  return (
    <div
      ref={containerRef}
      className="relative hidden sm:block w-full h-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
    >
      {spawns.map((s) => (
        <div
          key={s.key}
          aria-hidden
          className="absolute pointer-events-none overflow-hidden rounded-md shadow-xl cursor-spawn"
          style={{
            left: s.x,
            top: s.y,
            width: s.size,
            aspectRatio: s.image.aspectRatio ?? 1.3,
          }}
        >
          <Image src={s.image.src} alt="" fill sizes="220px" className="object-cover" />
        </div>
      ))}
    </div>
  )
}
