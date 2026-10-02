import Image from 'next/image'
import Link from 'next/link'

export type ArtPreview = { key: string; src: string; title: string; aspectRatio: number | null }

// Vorschau auf Armandas Kunst-Portfolio: ein paar Werke als versetzte Reihe,
// jedes verlinkt auf die Kunst-Seite.
export function ArtSectionPreview({ works }: { works: ArtPreview[] }) {
  if (works.length === 0) return null
  return (
    <ul className="flex gap-3 md:gap-5 items-start overflow-hidden">
      {works.map((work, i) => (
        <li key={work.key} className="flex-1 min-w-0" style={{ marginTop: i % 2 === 1 ? '2.5rem' : 0 }}>
          <Link href="/" className="group block relative overflow-hidden" style={{ aspectRatio: work.aspectRatio ?? 1 }}>
            <Image
              src={work.src}
              alt={work.title}
              fill
              sizes="(min-width: 768px) 20vw, 25vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}
