import type { Metadata, Viewport } from 'next'
import { Geist, IBM_Plex_Mono, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import { AnalyticsGate, ConsentBanner } from '@/components/legal/consent'
import { LenisProvider } from '@/components/lenis-provider'
import './globals.css'

// Self-hosted at build time: no request to Google at runtime, so the CSP stays same-origin.
const sans = Instrument_Sans({ subsets: ['latin'], variable: '--font-ui', display: 'swap' })
const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-code',
  display: 'swap',
})
// The QADAM showcase uses the startup's own type: Geist and JetBrains Mono.
const qadamSans = Geist({ subsets: ['latin', 'cyrillic'], variable: '--font-qadam-sans', display: 'swap' })
const qadamMono = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-qadam-mono',
  display: 'swap',
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Amir Nagiyev',
  url: 'https://www.a-nagiyev.dev',
  jobTitle: 'AI & Machine Learning Student',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Astana',
    addressCountry: 'Kazakhstan',
  },
  sameAs: ['https://github.com/amir-nagiyev', 'https://t.me/amirnagiyevdev'],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.a-nagiyev.dev'),
  title: 'Amir Nagiyev: AI & ML Student Portfolio',
  description:
    'Undergraduate in AI & Machine Learning based in Astana. Targeting Japanese JLPT N2.',
  keywords: ['Amir Nagiyev', 'AI', 'Machine Learning', 'Go', 'Python', 'PyTorch', 'Astana', 'Kazakhstan'],
  authors: [{ name: 'Amir Nagiyev', url: 'https://www.a-nagiyev.dev' }],
  alternates: {
    canonical: 'https://www.a-nagiyev.dev/',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.a-nagiyev.dev/',
    title: 'Amir Nagiyev: AI & ML Student Portfolio',
    description:
      'Undergraduate in AI & Machine Learning based in Astana. Targeting Japanese JLPT N2.',
    images: [
      {
        url: 'https://www.a-nagiyev.dev/preview.jpg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amir Nagiyev: AI & ML Student Portfolio',
    description:
      'Undergraduate in AI & Machine Learning based in Astana. Targeting Japanese JLPT N2.',
    images: ['https://www.a-nagiyev.dev/preview.jpg'],
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
    <html lang="en" className={`${sans.variable} ${mono.variable} ${qadamSans.variable} ${qadamMono.variable} bg-neutral-950`}>
      <head>
        <meta name="google-site-verification" content="KPmgGOHR8PsHJk7j0fL7ttP_IwAu_gjf-6hLpbWV7KU" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
