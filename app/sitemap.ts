import type { MetadataRoute } from 'next'
import { LAST_UPDATED, PROJECTS, SITE_URL, absolute } from '@/lib/seo'

/** Served at /sitemap.xml. Bump the dates in lib/seo.ts when a page changes. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, lastModified: LAST_UPDATED, changeFrequency: 'monthly', priority: 1 },
    ...PROJECTS.map((p) => ({
      url: absolute(p.path),
      lastModified: p.updated,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    { url: absolute('/privacy'), lastModified: '2026-10-13', changeFrequency: 'yearly', priority: 0.2 },
    { url: absolute('/terms'), lastModified: '2026-10-13', changeFrequency: 'yearly', priority: 0.2 },
    { url: absolute('/refund'), lastModified: '2026-10-13', changeFrequency: 'yearly', priority: 0.2 },
  ]
}
