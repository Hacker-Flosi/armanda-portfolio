'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react'

const INTERVAL_MS = 3800

// Horizontale Reihe, die automatisch Element für Element nach links gleitet
// und endlos im Kreis läuft — auch beim manuellen Scrollen in beide
// Richtungen (Inhalt wird dafür dreifach gerendert). Pausiert bei Hover/Touch/
// manuellem Scrollen, ausserhalb des Viewports und bei reduzierter Bewegung.
export function AutoSlider({ children, className }: { children: ReactNode; className?: string }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const badgeRef = useRef<HTMLDivElement>(null)
  const target = useRef({ x: 0, y: 0 })
  const current = useRef({ x: 0, y: 0 })
  const drag = useRef<{ x: number; left: number; moved: boolean; samples: { t: number; x: number }[] } | null>(null)
  const suppressClick = useRef(false)
  const normalizeRef = useRef<() => number>(() => 0)
  const inertiaFrame = useRef(0)
  const pauseRef = useRef<() => void>(() => {})
  const resumeRef = useRef<() => void>(() => {})
  const [inside, setInside] = useState(false)
  // Wie oft der Inhalt wiederholt wird. Mindestens dreimal; ist der Inhalt
  // schmal (wenige Kacheln, breiter Bildschirm), entsprechend öfter, damit
  // der Endlos-Lauf auch dann nie an ein Ende stösst.
  const [copies, setCopies] = useState(3)
  const copiesRef = useRef(3)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    copiesRef.current = copies
  }, [copies])

  // Cursor-Badge folgt der Maus weich.
  useEffect(() => {
    let frame = 0
    function tick() {
      current.current.x += (target.current.x - current.current.x) * 0.2
      current.current.y += (target.current.y - current.current.y) * 0.2
      const el = badgeRef.current
      if (el) el.style.transform = `translate(${current.current.x}px, ${current.current.y}px)`
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  // Horizontaler Parallax (Desktop): das Medium in jeder Kachel ist grösser
  // als die Kachel und gleitet beim Durchfahren gegen die Laufrichtung, also
  // langsamer als der Rahmen. Das Hover-Zoomen der Medien bleibt erhalten.
  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const mq = window.matchMedia('(min-width: 768px) and (hover: hover) and (prefers-reduced-motion: no-preference)')
    if (!mq.matches) return
    const media = new Map<Element, HTMLElement | null>()
    let frame = 0

    function update() {
      frame = 0
      const box = scroller!.getBoundingClientRect()
      const center = box.left + box.width / 2
      for (const child of Array.from(scroller!.children)) {
        const rect = child.getBoundingClientRect()
        if (rect.right < box.left - 80 || rect.left > box.right + 80) continue
        let el = media.get(child)
        if (el === undefined) {
          el = child.querySelector<HTMLElement>('img, video')
          // Nur die Transform-Eigenschaft übergangslos animieren; der
          // Hover-Zoom (scale) behält seine weiche Transition.
          if (el) el.style.transition = 'scale 0.7s cubic-bezier(0.16, 1, 0.3, 1)'
          media.set(child, el)
        }
        if (!el) continue
        const progress = (rect.left + rect.width / 2 - center) / (box.width / 2 + rect.width / 2)
        const shift = -Math.max(-1, Math.min(1, progress)) * rect.width * 0.1
        el.style.transform = `translate3d(${shift.toFixed(1)}px, 0, 0) scale(1.22)`
      }
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    scroller.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // Medien laden später und ändern die Kachelbreite: nachziehen.
    const observer = new ResizeObserver(schedule)
    observer.observe(scroller)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      scroller.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      observer.disconnect()
      for (const el of media.values()) {
        if (el) {
          el.style.transform = ''
          el.style.transition = ''
        }
      }
    }
  }, [])

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let paused = false
    let visible = false
    let resumeTimer: number | undefined
    let settleTimer: number | undefined

    // Inhalt steht dreimal im Scroller. Wir bleiben im mittleren Abschnitt
    // [S, 2S): verlässt die Position ihn, wird sie unsichtbar um S verschoben.
    const loopWidth = () => {
      const items = scroller.children
      const single = items.length / copiesRef.current
      const width = (items[single] as HTMLElement).offsetLeft
      return width > 8 ? width : 0
    }
    // Gibt die vorgenommene Verschiebung zurück (0, +S oder -S).
    const normalize = () => {
      const width = loopWidth()
      if (!width) return 0
      if (scroller.scrollLeft < width) {
        scroller.scrollLeft += width
        return width
      }
      if (scroller.scrollLeft >= width * 2) {
        scroller.scrollLeft -= width
        return -width
      }
      return 0
    }
    normalizeRef.current = normalize

    // Genügend Wiederholungen für die aktuelle Breite sicherstellen.
    function ensureCopies() {
      const items = scroller!.children
      const single = items.length / copiesRef.current
      const width = (items[single] as HTMLElement | undefined)?.offsetLeft ?? 0
      if (width <= 0) return
      const needed = Math.max(3, Math.ceil(2 + scroller!.clientWidth / width))
      if (needed !== copiesRef.current) setCopies(needed)
    }
    ensureCopies()
    const sizeObserver = new ResizeObserver(ensureCopies)
    sizeObserver.observe(scroller)
    const onScroll = () => {
      window.clearTimeout(settleTimer)
      settleTimer = window.setTimeout(normalize, 120)
    }
    normalize()

    const pause = () => {
      paused = true
      window.clearTimeout(resumeTimer)
    }
    pauseRef.current = pause
    const resumeSoon = () => {
      window.clearTimeout(resumeTimer)
      resumeTimer = window.setTimeout(() => {
        paused = false
      }, 2500)
    }
    resumeRef.current = resumeSoon

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    }, { threshold: 0.3 })
    observer.observe(scroller)

    const tick = window.setInterval(() => {
      if (paused || !visible) return
      if (!loopWidth()) return
      normalize()
      const items = Array.from(scroller.children) as HTMLElement[]
      const next = items.find((el) => el.offsetLeft > scroller.scrollLeft + 8)
      if (next) scroller.scrollTo({ left: next.offsetLeft, behavior: 'smooth' })
    }, INTERVAL_MS)

    scroller.addEventListener('scroll', onScroll, { passive: true })
    scroller.addEventListener('pointerenter', pause)
    scroller.addEventListener('pointerleave', resumeSoon)
    scroller.addEventListener('touchstart', pause, { passive: true })
    scroller.addEventListener('touchend', resumeSoon, { passive: true })
    scroller.addEventListener('wheel', pause, { passive: true })

    return () => {
      cancelAnimationFrame(inertiaFrame.current)
      window.clearInterval(tick)
      window.clearTimeout(resumeTimer)
      window.clearTimeout(settleTimer)
      observer.disconnect()
      sizeObserver.disconnect()
      scroller.removeEventListener('scroll', onScroll)
      scroller.removeEventListener('pointerenter', pause)
      scroller.removeEventListener('pointerleave', resumeSoon)
      scroller.removeEventListener('touchstart', pause)
      scroller.removeEventListener('touchend', resumeSoon)
      scroller.removeEventListener('wheel', pause)
    }
  }, [])

  useEffect(() => {
    normalizeRef.current()
  }, [copies])

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !scrollerRef.current) return
    cancelAnimationFrame(inertiaFrame.current)
    drag.current = { x: e.clientX, left: scrollerRef.current.scrollLeft, moved: false, samples: [] }
    suppressClick.current = false
    setPressed(true)
    pauseRef.current()

    function onMove(ev: PointerEvent) {
      const state = drag.current
      const scroller = scrollerRef.current
      if (!state || !scroller) return
      const dx = ev.clientX - state.x
      if (!state.moved && Math.abs(dx) > 5) {
        state.moved = true
        suppressClick.current = true
      }
      if (state.moved) {
        scroller.scrollLeft = state.left - dx
        state.left += normalizeRef.current()
        const now = performance.now()
        state.samples.push({ t: now, x: ev.clientX })
        while (state.samples.length > 1 && now - state.samples[0].t > 100) state.samples.shift()
      }
    }
    function onUp() {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      const state = drag.current
      drag.current = null
      setPressed(false)

      // Schwung: Geschwindigkeit der letzten ~100 ms weiterlaufen lassen und
      // sanft abbremsen.
      const scroller = scrollerRef.current
      const first = state?.samples[0]
      const last = state?.samples[state.samples.length - 1]
      let velocity = first && last && last.t > first.t ? -(last.x - first.x) / (last.t - first.t) : 0
      if (!scroller || Math.abs(velocity) < 0.05 || performance.now() - (last?.t ?? 0) > 80) {
        resumeRef.current()
        return
      }
      let previous = performance.now()
      const step = (now: number) => {
        const dt = Math.min(32, now - previous)
        previous = now
        scroller.scrollLeft += velocity * dt
        normalizeRef.current()
        velocity *= Math.pow(0.94, dt / 16)
        if (Math.abs(velocity) > 0.02) {
          inertiaFrame.current = requestAnimationFrame(step)
        } else {
          resumeRef.current()
        }
      }
      inertiaFrame.current = requestAnimationFrame(step)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType !== 'mouse') return
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (!inside) {
      current.current = { x, y }
      setInside(true)
    }
    target.current = { x, y }
  }

  function onClickCapture(e: ReactMouseEvent<HTMLDivElement>) {
    if (suppressClick.current) {
      e.preventDefault()
      e.stopPropagation()
      suppressClick.current = false
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={`relative overflow-hidden ${className ?? ''}`}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setInside(false)}
    >
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        style={{ scale: pressed ? 0.992 : 1, transition: pressed ? 'scale 0.2s ease-out' : 'scale 0.6s cubic-bezier(0.34, 1.4, 0.5, 1)' }}
        className="flex items-center md:items-stretch gap-0.5 h-full overflow-x-auto overscroll-x-contain select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [@media(hover:hover)]:cursor-none"
      >
        {Array.from({ length: copies }, (_, i) => (
          <Fragment key={i}>{children}</Fragment>
        ))}
      </div>

      <div ref={badgeRef} aria-hidden className="hidden [@media(hover:hover)]:block absolute top-0 left-0 z-10 pointer-events-none">
        <div
          className="-translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-1 w-[72px] h-[72px] rounded-full text-xs font-medium"
          style={{
            opacity: inside ? 1 : 0,
            // Gedrückt: zieht sich zusammen und kehrt (beim Loslassen) mit
            // leichtem Überschwingen zurück.
            transform: `scale(${!inside ? 0.5 : pressed ? 0.78 : 1})`,
            background: pressed ? 'var(--bg)' : 'var(--ink)',
            color: pressed ? 'var(--ink)' : 'var(--bg)',
            boxShadow: pressed ? 'inset 0 0 0 1.5px var(--ink)' : 'none',
            transition: pressed
              ? 'transform 0.18s ease-out, background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, opacity 0.3s ease-out'
              : 'transform 0.55s cubic-bezier(0.34, 1.7, 0.5, 1), background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease, opacity 0.3s ease-out',
          }}
        >
          <span style={{ display: 'inline-block', transform: pressed ? 'translateX(3px)' : 'none', transition: 'transform 0.35s cubic-bezier(0.34, 1.7, 0.5, 1)' }}>←</span>
          <span>Drag</span>
          <span style={{ display: 'inline-block', transform: pressed ? 'translateX(-3px)' : 'none', transition: 'transform 0.35s cubic-bezier(0.34, 1.7, 0.5, 1)' }}>→</span>
        </div>
      </div>
    </div>
  )
}
