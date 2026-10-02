// Runder "Vergrössern"-Hinweis oben rechts in der Ecke einer Kachel, nur auf
// dem Handy (rein dekorativ; die ganze Kachel ist der Button, der die
// Detailansicht öffnet). Auf Desktop reicht der Klick auf die Kachel.
export function EnlargeBadge() {
  return (
    <span
      aria-hidden
      className="sm:hidden absolute right-3 top-3 z-[2] w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center backdrop-blur transition-transform duration-300 group-hover:scale-110"
    >
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <path d="M9.5 2H14v4.5M6.5 14H2V9.5M14 2L9 7M2 14l5-5" />
      </svg>
    </span>
  )
}
