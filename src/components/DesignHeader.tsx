import { DesignNavLink } from '@/components/DesignNavLink'
import { getSiteSettings } from '@/sanity/lib/queries'
import { CvButton, CvGate } from '@/components/CvGate'

export async function DesignHeader() {
  const settings = await getSiteSettings()

  return (
    <header style={{ viewTransitionName: 'design-header' }} className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-[var(--bar-bg)] text-[var(--bar-fg)] px-4 h-9 text-base shrink-0 whitespace-nowrap">
      <DesignNavLink href="/design" variant="down" className="font-medium">
        Armanda Asani
      </DesignNavLink>
      <span className="hidden sm:inline">Verfügbar Oktober 26</span>
      <span className="sm:hidden">Ab Okt. 26</span>
      <nav className="flex items-center gap-4">
        {settings?.cvUrl && <CvButton />}
        <DesignNavLink href="/design/info" variant="up">
          Info
        </DesignNavLink>
      </nav>
      {settings?.cvUrl && <CvGate />}
    </header>
  )
}
