import type { Metadata } from 'next'
import { ProjectCase } from '@/components/project-case'
import { PROJECTS } from '@/lib/seo'
import { voyageLinks } from '@/lib/site'

const project = PROJECTS.find((p) => p.slug === 'voyage-ai')!

export const metadata: Metadata = {
  title: { absolute: project.title },
  description: project.description,
  alternates: { canonical: project.path },
  openGraph: {
    type: 'article',
    url: project.path,
    title: project.title,
    description: project.description,
    images: [{ url: project.ogImage, width: 1200, height: 675, alt: project.imageAlt }],
  },
  twitter: { card: 'summary_large_image', title: project.title, description: project.description, images: [project.ogImage] },
}

export default function VoyageCase() {
  return (
    <ProjectCase
      project={project}
      lead="Voyage AI replaces a stack of search forms with one sentence. Describe the trip, and the agent asks only for what is missing, checks the budget against reality and returns three priced packages with flights, dates and meal plans."
      role="Solo project: agent design, backend and interface"
      status="Interactive MVP, live demo on this site"
      stack={['Python', 'FastAPI', 'SQLite (WAL)', 'LLM extraction', 'TypeScript', 'Next.js', 'React']}
      links={[
        { label: 'Try it on the home page', href: '/#voyage' },
        { label: 'Source on GitHub', href: voyageLinks.repo },
      ]}
      sections={[
        {
          heading: 'The problem',
          body: (
            <p>
              Booking a package holiday from Kazakhstan usually means filling in the same filters on several sites:
              destination, departure city, nights, party size, budget, meal plan. Most of those answers are already in
              the one sentence a traveller would say out loud.
            </p>
          ),
        },
        {
          heading: 'What I built',
          body: (
            <ul>
              <li>
                <strong>Slot filling agent.</strong> It extracts destination, origin, nights, budget and party size from
                free text, keeps them across turns and asks a single follow up question when something is missing.
              </li>
              <li>
                <strong>Budget reality check.</strong> Before searching, the agent compares the budget with real package
                prices and says so when a request cannot be met.
              </li>
              <li>
                <strong>Ranking.</strong> A catalog of 50 resorts in 10 countries is filtered and ranked by fit, then
                combined with a matching flight into complete packages priced in tenge and US dollars.
              </li>
              <li>
                <strong>Booking flow.</strong> Each package lets you shift the dates, change the meal plan, pick a suite
                and send a reservation request.
              </li>
            </ul>
          ),
        },
        {
          heading: 'Engineering decisions',
          body: (
            <ul>
              <li>The original service is Python and FastAPI with SQLite in WAL mode for concurrent reads and writes, and an LLM for extraction.</li>
              <li>
                For this portfolio I ported the deterministic half of the agent to TypeScript. The demo runs as a
                same-origin, rate limited API route with no API keys and no stored data, so it answers instantly and
                predictably.
              </li>
            </ul>
          ),
        },
      ]}
    />
  )
}
