import Link from 'next/link'
import { getSiteSettings } from '@/sanity/lib/queries'

export async function SiteFooter() {
  const settings = await getSiteSettings()

  const mailHref = settings?.mailAddress
    ? `mailto:${settings.mailAddress}${
        settings.mailSubject ? `?subject=${encodeURIComponent(settings.mailSubject)}` : ''
      }`
    : 'mailto:mail@armanda-asani.ch?subject=hoi'

  return (
    <footer className="sticky bottom-0 z-20 flex items-center justify-between bg-[var(--bar-bg)] text-[var(--bar-fg)] px-4 h-9 text-base shrink-0">
      <a href={mailHref}>Mail</a>
      <a href={settings?.instagramUrl ?? 'https://www.instagram.com/armanda.asani/'} target="_blank" rel="noreferrer">
        Instagram
      </a>
      <a
        href={settings?.printsUrl ?? 'https://www.supportyourlocalartist.ch/collections/armanda-asani'}
        target="_blank"
        rel="noreferrer"
      >
        Prints
      </a>
      <Link href="/impressum">Impressum</Link>
    </footer>
  )
}
