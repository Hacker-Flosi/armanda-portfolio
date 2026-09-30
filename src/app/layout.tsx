import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Armanda Asani',
  description: 'Armanda Asani — Kunst Portfolio',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
