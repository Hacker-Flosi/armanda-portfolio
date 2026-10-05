'use client'

import { useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import Image from 'next/image'
import { MaskRevealText } from '@/components/MaskRevealText'
import { Reveal } from '@/components/Reveal'

export type HeroPrint = { src: string; alt: string }

const LIFETIME = 1100
const START = [
  { x: 4, y: 18, r: -7 },
  { x: 38, y: 4, r: 5 },
  { x: 24, y: 40, r: -2 },
  { x: 58, y: 34, r: 8 },
  { x: 8, y: 52, r: 4 },
]

// Einstieg der Illustrations-Seite: ruhige Typografie und ein paar Drucke zum
// Anfassen. Die Maus zeichnet eine feine Bleistiftspur, die Drucke lassen sich
// herumschieben.
export function IllustrationHero({
  title,
  text,
  prints,
}: {
  title: string
  text: string
  prints: HeroPrint[]
}) {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const areaRef = useRef<HTMLDivElement>(null)
  const points = useRef<{ x: number; y: number; t: number; break?: boolean }[]>([])
  const drawing = useRef(0)
  const topZ = useRef(10)

  // Bleistiftspur: nur mit Maus, verblasst nach kurzer Zeit.
  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    if (!section || !canvas) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      const rect = section!.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas!.width = rect.width * dpr
      canvas!.height = rect.height * dpr
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(section)

    let ink = getComputedStyle(section).color
    function frame() {
      ink = getComputedStyle(section!).color
      const now = performance.now()
      const rect = section!.getBoundingClientRect()
      ctx!.clearRect(0, 0, rect.width, rect.height)
      points.current = points.current.filter((p) => now - p.t < LIFETIME)
      ctx!.lineCap = 'round'
      ctx!.lineJoin = 'round'
      for (let i = 1; i < points.current.length; i++) {
        const a = points.current[i - 1]
        const b = points.current[i]
        if (b.break) continue
        const age = (now - b.t) / LIFETIME
        ctx!.strokeStyle = ink
        ctx!.globalAlpha = Math.max(0, 1 - age) * 0.55
        ctx!.lineWidth = 1.8 * (1 - age * 0.6)
        ctx!.beginPath()
        ctx!.moveTo(a.x, a.y)
        ctx!.lineTo(b.x, b.y)
        ctx!.stroke()
      }
      ctx!.globalAlpha = 1
      drawing.current = points.current.length > 1 ? requestAnimationFrame(frame) : 0
    }

    function onMove(e: MouseEvent) {
      const rect = section!.getBoundingClientRect()
      const x = e.clientX - rect.left + (Math.random() - 0.5) * 1.4
      const y = e.clientY - rect.top + (Math.random() - 0.5) * 1.4
      const last = points.current[points.current.length - 1]
      points.current.push({ x, y, t: performance.now(), break: !last || performance.now() - last.t > 120 })
      if (!drawing.current) drawing.current = requestAnimationFrame(frame)
    }
    section.addEventListener('mousemove', onMove)
    return () => {
      section.removeEventListener('mousemove', onMove)
      observer.disconnect()
      if (drawing.current) cancelAnimationFrame(drawing.current)
    }
  }, [])

  function nextZ() {
    topZ.current += 1
    return topZ.current
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden px-4 pt-14 sm:pt-20 pb-16 sm:pb-24 min-h-[calc(100svh-36px)] flex flex-col justify-center">
      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 w-full h-full pointer-events-none z-[5]" />

      <div className="relative z-10 grid gap-10 lg:grid-cols-[7fr_5fr] lg:gap-6 items-center max-w-[1500px] mx-auto w-full">
        <div className="flex flex-col gap-8">
          <MaskRevealText
            text={title}
            lineHeight={0.96}
            className="font-medium"
            style={{ fontSize: 'clamp(2.3rem, 1rem + 5.6vw, 6.4rem)', letterSpacing: '-0.04em' }}
          />
          <Reveal className="reveal-soft flex flex-col gap-7 max-w-xl">
            <p className="text-lg leading-snug sm:text-xl">{text}</p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href="#konfigurator" className="h-12 px-7 inline-flex items-center rounded-full border border-[var(--ink)] font-medium hover:bg-[var(--ink)] hover:!text-[var(--bg)] transition-colors duration-300">
                Projekt zusammenstellen
              </a>
              <a href="#rueckruf" className="underline underline-offset-4">
                Lieber ein Gespräch?
              </a>
            </div>
          </Reveal>
        </div>

        {/* Spielfläche: verschiebbare Drucke */}
        <div ref={areaRef} className="relative h-[380px] sm:h-[520px] lg:h-[600px] select-none">
          {prints.slice(0, START.length).map((print, i) => (
            <DraggablePrint key={print.src} print={print} start={START[i]} nextZ={nextZ} area={areaRef} />
          ))}
        </div>
      </div>
    </section>
  )
}

function DraggablePrint({
  print,
  start,
  nextZ,
  area,
}: {
  print: HeroPrint
  start: { x: number; y: number; r: number }
  nextZ: () => number
  area: React.RefObject<HTMLDivElement | null>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0 })
  const drag = useRef<{ px: number; py: number; ox: number; oy: number; vx: number } | null>(null)
  const [lifted, setLifted] = useState(false)
  const [rotation, setRotation] = useState(start.r)

  // Startposition in Prozent der Spielfläche.
  useEffect(() => {
    const el = ref.current
    const box = area.current
    if (!el || !box) return
    const place = () => {
      pos.current = { x: (start.x / 100) * box.clientWidth, y: (start.y / 100) * box.clientHeight }
      el.style.left = `${pos.current.x}px`
      el.style.top = `${pos.current.y}px`
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(box)
    return () => observer.disconnect()
  }, [area, start.x, start.y])

  function onDown(e: ReactPointerEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    el.setPointerCapture(e.pointerId)
    el.style.zIndex = String(nextZ())
    drag.current = { px: e.clientX, py: e.clientY, ox: pos.current.x, oy: pos.current.y, vx: 0 }
    setLifted(true)
  }
  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    const state = drag.current
    const el = ref.current
    const box = area.current
    if (!state || !el || !box) return
    const x = Math.min(box.clientWidth - el.offsetWidth * 0.5, Math.max(-el.offsetWidth * 0.5, state.ox + e.clientX - state.px))
    const y = Math.min(box.clientHeight - el.offsetHeight * 0.4, Math.max(-el.offsetHeight * 0.4, state.oy + e.clientY - state.py))
    state.vx = x - pos.current.x
    pos.current = { x, y }
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    setRotation(start.r + Math.max(-14, Math.min(14, state.vx * 0.9)))
  }
  function onUp() {
    drag.current = null
    setLifted(false)
    setRotation((r) => (Math.abs(r - start.r) > 0 ? start.r + (Math.random() - 0.5) * 6 : r))
  }

  return (
    <div
      ref={ref}
      data-print
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
      className="absolute w-[44%] max-w-[240px] aspect-[3/4] cursor-grab active:cursor-grabbing touch-none bg-[var(--bg)] p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
      style={{
        zIndex: 10,
        transform: `rotate(${rotation}deg) scale(${lifted ? 1.06 : 1})`,
        transition: lifted ? 'transform 0.15s ease-out' : 'transform 0.6s cubic-bezier(0.34, 1.6, 0.5, 1)',
      }}
    >
      <div className="relative w-full h-full overflow-hidden">
        <Image src={print.src} alt={print.alt} fill sizes="240px" draggable={false} className="object-cover pointer-events-none" />
      </div>
    </div>
  )
}
