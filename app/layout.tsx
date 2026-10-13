import type { Metadata, Viewport } from 'next'
import { AnalyticsGate, ConsentBanner } from '@/components/legal/consent'
import { LenisProvider } from '@/components/lenis-provider'
import './globals.css'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Amir Nagiyev',
  url: 'https://www.a-nagiyev.dev',
  jobTitle: 'Computer Science & AI Student',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Astana',
    addressCountry: 'Kazakhstan',
  },
  sameAs: ['https://github.com/amir-nagiyev'],
}

export const metadata: Metadata = {
  metadataBase: new URL('https://www.a-nagiyev.dev'),
  title: 'Amir Nagiyev — Computer Science & AI Student Portfolio',
  description:
    'Portfolio of Amir Nagiyev, a Computer Science and AI student based in Astana, Kazakhstan. Showcasing projects, technical skills in Go, Python, and AI development.',
  keywords: ['Amir Nagiyev', 'AI', 'Machine Learning', 'Go', 'Python', 'Computer Science', 'Astana', 'Kazakhstan'],
  authors: [{ name: 'Amir Nagiyev', url: 'https://www.a-nagiyev.dev' }],
  alternates: {
    canonical: 'https://www.a-nagiyev.dev/',
  },
  openGraph: {
    type: 'website',
    url: 'https://www.a-nagiyev.dev/',
    title: 'Amir Nagiyev — Computer Science & AI Student Portfolio',
    description:
      'Explore projects and research by Amir Nagiyev, specializing in Computer Science and Artificial Intelligence.',
    images: [
      {
        url: 'https://www.a-nagiyev.dev/preview.jpg',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Amir Nagiyev — Computer Science & AI Student Portfolio',
    description:
      'Explore projects and research by Amir Nagiyev, specializing in Computer Science and Artificial Intelligence.',
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
    <html lang="en" className="bg-neutral-950">
      <head>
        <meta name="google-site-verification" content="KPmgGOHR8PsHJk7j0fL7ttP_IwAu_gjf-6hLpbWV7KU" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Sans:wght@400..700&display=swap"
        />
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
