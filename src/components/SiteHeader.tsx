import Link from 'next/link'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between bg-[var(--bar-bg)] text-[var(--bar-fg)] px-4 h-11 text-sm shrink-0">
      <Link href="/" className="font-medium">
        Armanda Asani
      </Link>
      <Link href="/info">Info</Link>
    </header>
  )
}
