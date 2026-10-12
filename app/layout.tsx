import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, Instrument_Sans } from 'next/font/google'
import { AnalyticsGate, ConsentBanner } from '@/components/legal/consent'
import { LenisProvider } from '@/components/lenis-provider'
import './globals.css'

// Both families are licensed under the SIL Open Font License 1.1 and are self-hosted at build time
// by next/font, so visitors never make a request to Google.
const ui = Instrument_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-ui', display: 'swap' })
const code = IBM_Plex_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-code',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Amir Nagiyev · AI & ML Engineer & Systems Architect',
  description:
    'Portfolio of Amir Nagiyev, a 17-year-old AI & ML undergraduate in Astana, Kazakhstan. Neural networks, Go systems engineering, FastAPI backends and the Voyage AI engine.',
  keywords: ['Amir Nagiyev', 'AI', 'Machine Learning', 'Go', 'FastAPI', 'Next.js', 'Astana', 'Kazakhstan'],
  authors: [{ name: 'Amir Nagiyev' }],
  openGraph: {
    title: 'Amir Nagiyev · AI & ML Engineer & Systems Architect',
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
    <html lang="en" className={`${ui.variable} ${code.variable} bg-neutral-950`}>
      <body className="font-sans antialiased">
        <LenisProvider>{children}</LenisProvider>
        <ConsentBanner />
        <AnalyticsGate />
      </body>
    </html>
  )
}
