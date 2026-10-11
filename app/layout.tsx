import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { FilmGrain } from '@/components/film-grain'
import { LenisProvider } from '@/components/lenis-provider'
import './globals.css'

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans', display: 'swap' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono', display: 'swap' })

export const metadata: Metadata = {
  title: 'Amir Nagiyev — AI & ML Engineer & Systems Architect',
  description:
    'Portfolio of Amir Nagiyev, a 17-year-old AI & ML undergraduate in Astana, Kazakhstan. Neural networks, Go systems engineering, FastAPI backends and the Zari Travel MVP.',
  generator: 'v0.app',
  keywords: ['Amir Nagiyev', 'AI', 'Machine Learning', 'Go', 'FastAPI', 'Next.js', 'Astana', 'Kazakhstan'],
  authors: [{ name: 'Amir Nagiyev' }],
  openGraph: {
    title: 'Amir Nagiyev — AI & ML Engineer & Systems Architect',
    description: 'AI & ML undergraduate based in Astana, Kazakhstan.',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} bg-neutral-950`}>
      <body className="font-sans antialiased">
        <LenisProvider>{children}</LenisProvider>
        <FilmGrain />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
