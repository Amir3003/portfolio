import type { Metadata, Viewport } from 'next'
import { Geist, IBM_Plex_Mono, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { AnalyticsGate, ConsentBanner } from '@/components/legal/consent'
import { LenisProvider } from '@/components/lenis-provider'
import { PERSON, SITE_DESCRIPTION, SITE_TITLE, SITE_URL, personJsonLd } from '@/lib/seo'
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

// TikTok Sans, variable width (75 to 150) and weight (300 to 900): the boarding pass and the
// large display words. Self-hosted from lib/fonts.
const display = localFont({
  src: '../lib/fonts/tiktoksans-latin.woff2',
  weight: '300 900',
  style: 'normal',
  variable: '--font-tiktok',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '75% 150%' }],
})

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    personJsonLd(),
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: PERSON.name,
      url: `${SITE_URL}/`,
      inLanguage: 'en',
      publisher: { '@id': `${SITE_URL}/#person` },
    },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s · ${PERSON.name}` },
  description: SITE_DESCRIPTION,
  applicationName: PERSON.name,
  keywords: ['Amir Nagiyev', 'Амир Нагиев', 'QADAM', 'Voyage AI', 'AI developer', 'Machine Learning', 'Astana', 'Kazakhstan'],
  authors: [{ name: PERSON.name, url: SITE_URL }],
  creator: PERSON.name,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: '/',
    siteName: PERSON.name,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
    <html lang="en" className={`${sans.variable} ${mono.variable} ${qadamSans.variable} ${qadamMono.variable} ${display.variable} bg-neutral-950`}>
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
