import { PERSONAL_EMAIL, qadamLinks, socials, voyageLinks } from '@/lib/site'

/** Canonical origin. The bare domain 301-redirects here (Vercel domain settings). */
export const SITE_URL = 'https://www.a-nagiyev.dev'

export const PERSON = {
  name: 'Amir Nagiyev',
  alternateNames: ['Амир Нагиев', 'Amir Nagiev'],
  jobTitle: 'AI & ML Developer',
  city: 'Astana',
  country: 'Kazakhstan',
  school: 'QAIRU',
} as const

export const SITE_TITLE = 'Amir Nagiyev · AI & ML Developer · Astana'
export const SITE_DESCRIPTION =
  'Amir Nagiyev, AI and ML developer from Astana. Founder of QADAM and builder of Voyage AI: case studies, stack and contacts.'

export interface ProjectSeo {
  slug: string
  name: string
  /** Page title, under 60 characters. */
  title: string
  /** Meta description, under 155 characters. */
  description: string
  path: string
  image: string
  /** 1200x675 JPEG for link previews (WebP is not read by every crawler). */
  ogImage: string
  imageAlt: string
  externalUrl: string
  category: string
  /** ISO date of the last meaningful change, used for sitemap lastmod. */
  updated: string
}

export const PROJECTS: readonly ProjectSeo[] = [
  {
    slug: 'qadam',
    name: 'QADAM',
    title: 'QADAM · AI opportunity hub for students',
    description:
      'QADAM by Amir Nagiyev: a radar for grants, hackathons and internships students are eligible for, CV gap analysis and messenger alerts.',
    path: '/projects/qadam',
    image: '/projects/qadam.webp',
    ogImage: '/projects/qadam-og.jpg',
    imageAlt: 'QADAM welcome screen with the eligibility radar, built by Amir Nagiyev',
    externalUrl: qadamLinks.site,
    category: 'EducationalApplication',
    updated: '2026-10-20',
  },
  {
    slug: 'voyage-ai',
    name: 'Voyage AI',
    title: 'Voyage AI · conversational travel concierge',
    description:
      'Voyage AI by Amir Nagiyev: one prompt in, three priced travel packages out. Slot-filling agent, hotel ranking and live budget checks.',
    path: '/projects/voyage-ai',
    image: '/projects/voyage-ai.webp',
    ogImage: '/projects/voyage-ai-og.jpg',
    imageAlt: 'Voyage AI travel concierge dashboard, built by Amir Nagiyev',
    externalUrl: voyageLinks.repo,
    category: 'TravelApplication',
    updated: '2026-10-20',
  },
]

export const LAST_UPDATED = '2026-10-20'

/** Personal profiles only: the QADAM accounts belong to the organisation, not the person. */
export const SAME_AS = socials.filter((s) => !/qadam/i.test(s.href)).map((s) => s.href)

export const absolute = (path: string): string => new URL(path, SITE_URL).toString()

export function personJsonLd() {
  return {
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: PERSON.name,
    alternateName: PERSON.alternateNames,
    jobTitle: PERSON.jobTitle,
    url: `${SITE_URL}/`,
    image: absolute('/opengraph-image'),
    sameAs: SAME_AS,
    email: `mailto:${PERSONAL_EMAIL}`,
    address: { '@type': 'PostalAddress', addressLocality: PERSON.city, addressCountry: PERSON.country },
    alumniOf: { '@type': 'CollegeOrUniversity', name: PERSON.school },
    worksFor: {
      '@type': 'Organization',
      name: 'QADAM',
      url: qadamLinks.site,
      sameAs: [qadamLinks.instagram, qadamLinks.tiktok],
    },
    knowsLanguage: ['ru', 'en'],
    knowsAbout: ['Machine Learning', 'PyTorch', 'Go', 'Python', 'TypeScript', 'React', 'AI agents'],
  }
}

export function projectJsonLd(project: ProjectSeo) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: project.name,
        description: project.description,
        url: absolute(project.path),
        image: absolute(project.image),
        applicationCategory: project.category,
        operatingSystem: 'Web',
        sameAs: [project.externalUrl],
        author: { '@id': `${SITE_URL}/#person` },
        creator: personJsonLd(),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: PERSON.name, item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Projects', item: absolute('/#projects') },
          { '@type': 'ListItem', position: 3, name: project.name, item: absolute(project.path) },
        ],
      },
    ],
  }
}
