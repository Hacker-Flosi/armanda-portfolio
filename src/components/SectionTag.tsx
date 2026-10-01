export function SectionTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center h-6 px-2.5 rounded-full border border-[var(--ink)]/20 text-xs font-medium">
      {children}
    </span>
  )
}
