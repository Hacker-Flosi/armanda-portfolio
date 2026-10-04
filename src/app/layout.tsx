import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { SmoothScroll } from '@/components/SmoothScroll'

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
    <html lang="de" className={`h-full ${esRebond.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: "try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
        <link rel="preconnect" href="https://cdn.sanity.io" crossOrigin="" />
      </head>
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        {children}
      </body>
    </html>
  )
}
