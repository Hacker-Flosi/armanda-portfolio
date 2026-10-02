import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

const esRebond = localFont({
  src: './fonts/ESRebondGrotesque-Medium.woff2',
  weight: '500',
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Armanda Asani',
  description: 'Armanda Asani — Kunst Portfolio',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="de" className={`h-full ${esRebond.variable}`}>
      <head>
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
