export function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex md:absolute md:top-0 md:left-0 items-center h-6 px-2.5 rounded-full border border-[var(--ink)]/20 text-xs font-medium bg-[var(--bg)]">
      {children}
    </span>
  )
}
