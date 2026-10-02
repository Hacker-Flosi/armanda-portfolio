'use client'

// Umschalter Hell/Dunkel. Das Icon zeigt per CSS den Modus, zu dem gewechselt
// wird (Mond im hellen, Sonne im dunklen Modus); die Wahl wird gespeichert.
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement
    const current = root.dataset.theme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    const next = current === 'dark' ? 'light' : 'dark'
    root.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Hell- und Dunkelmodus umschalten"
      title="Hell / Dunkel"
      className="flex items-center justify-center w-7 h-7 -mr-1 cursor-pointer"
    >
      <svg className="theme-icon-moon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
        <path d="M13.5 9.6A6 6 0 0 1 6.4 2.5a6 6 0 1 0 7.1 7.1z" />
      </svg>
      <svg className="theme-icon-sun" width="17" height="17" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
        <circle cx="8" cy="8" r="3" fill="currentColor" stroke="none" />
        <path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3 3l1.1 1.1M11.9 11.9L13 13M13 3l-1.1 1.1M4.1 11.9L3 13" />
      </svg>
    </button>
  )
}
