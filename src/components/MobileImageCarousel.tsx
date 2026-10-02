"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";
import Image from "next/image";
import { useLightbox } from "@/components/Lightbox";
import { ParallaxReveal } from "@/components/ParallaxReveal";

const INTERVAL_MS = 4500;
const LEAVE_MS = 180;

export type CarouselImage = { src: string; aspectRatio: number | null };

export function MobileImageCarousel({
  images,
  alt,
  globalIndices,
  startAt = 0,
  viewTransitionName,
}: {
  images: CarouselImage[];
  alt: string;
  globalIndices: number[];
  startAt?: number;
  viewTransitionName?: string;
}) {
  const { open } = useLightbox();
  // Wechsel wie im Grafik-Portfolio: das aktuelle Bild blendet kurz aus, dann
  // baut sich das nächste mit der Reveal-Bewegung auf (keine Überlagerung).
  const [index, setIndex] = useState(startAt);
  const [leaving, setLeaving] = useState(false);
  const [inView, setInView] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Fest auf das Start-Bild verankert, damit der Container beim Durchwechseln
  // nicht je nach Seitenverhältnis des aktuellen Bilds springt — andere
  // Formate werden stattdessen innerhalb der festen Box eingepasst.
  const boxAspectRatio = images[startAt]?.aspectRatio ?? 1.3;

  useEffect(() => {
    setReduceMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const advancing = inView && !reduceMotion && images.length > 1;
  const count = images.length;

  function go(next: number) {
    const target = (next + count) % count;
    if (target === index || leaving) return;
    setLeaving(true);
    window.setTimeout(
      () => {
        setIndex(target);
        setLeaving(false);
      },
      reduceMotion ? 0 : LEAVE_MS,
    );
  }

  function onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  }
  function onTouchEnd(e: TouchEvent) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(t.clientY - start.y))
      go(index + (dx < 0 ? 1 : -1));
  }

  const current = images[index];
  const style = useMemo(
    () => ({ aspectRatio: boxAspectRatio, viewTransitionName }),
    [boxAspectRatio, viewTransitionName],
  );
  if (!current) return null;

  return (
    <div
      ref={containerRef}
      className="sm:hidden relative w-full mx-auto max-h-[88dvh] overflow-hidden bg-[var(--bg)]"
      style={style}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <ParallaxReveal className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            opacity: leaving ? 0 : 1,
            transition: `opacity ${LEAVE_MS}ms ease-in`,
          }}
        >
          <div key={index} className="absolute inset-0 carousel-reveal">
            <Image
              src={current.src}
              alt={alt}
              fill
              sizes="100vw"
              draggable={false}
              className="object-contain object-left"
            />
          </div>
        </div>
      </ParallaxReveal>

      <button
        type="button"
        aria-label={`${alt} — nächstes Bild`}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const leftThird = e.clientX - rect.left < rect.width / 3;
          go(index + (leftThird ? -1 : 1));
        }}
        className="absolute inset-0 z-[1]"
      />
      <button
        type="button"
        aria-label={`${alt} — Bild vergrössern`}
        onClick={() => open(globalIndices[index])}
        className="absolute right-3 top-6 z-[3] w-10 h-10 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M9.5 2H14v4.5M6.5 14H2V9.5M14 2L9 7M2 14l5-5" />
        </svg>
      </button>

      {count > 1 && (
        <div className="absolute top-2 inset-x-2 z-[2] flex gap-1">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Bild ${i + 1} von ${count}`}
              onClick={() => go(i)}
              className="flex-1 h-5 flex items-start"
            >
              <span className="relative block w-full h-0.5 rounded-full bg-white/35 overflow-hidden">
                {i < index && <span className="absolute inset-0 bg-white" />}
                {i === index &&
                  (advancing ? (
                    <span
                      key={index}
                      className="absolute inset-y-0 left-0 bg-white carousel-fill"
                      style={{ animationDuration: `${INTERVAL_MS}ms` }}
                      onAnimationEnd={() => go(index + 1)}
                    />
                  ) : (
                    <span className="absolute inset-0 bg-white" />
                  ))}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
