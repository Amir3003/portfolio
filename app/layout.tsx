import type { Metadata, Viewport } from 'next'
import { AnalyticsGate, ConsentBanner } from '@/components/legal/consent'
import { LenisProvider } from '@/components/lenis-provider'
import './globals.css'

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
    <html lang="en" className="bg-neutral-950">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400..700&display=swap"
        />
      </head>
      <body className="font-sans antialiased">
        <LenisProvider>{children}</LenisProvider>
        <ConsentBanner />
        <AnalyticsGate />
      </body>
    </html>
  )
}
