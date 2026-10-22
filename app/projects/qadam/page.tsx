import type { Metadata } from 'next'
import { ProjectCase } from '@/components/project-case'
import { PROJECTS } from '@/lib/seo'
import { qadamLinks } from '@/lib/site'

const project = PROJECTS.find((p) => p.slug === 'qadam')!

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

export default function QadamCase() {
  return (
    <ProjectCase
      project={project}
      lead="QADAM («Қадам») means step in Kazakh. It finds the grants, hackathons, internships and AI programs a student is actually eligible for, shows what is missing in their CV, and sends the deadlines to Telegram, Discord and KakaoTalk."
      role="Founder: product, design and engineering"
      status="Live beta, public launch in progress"
      stack={['React 19', 'TypeScript', 'Vite', 'Tailwind CSS', 'Supabase', 'GitHub Actions', 'Node.js bots', 'Vercel']}
      links={[
        { label: 'Open QADAM', href: qadamLinks.site },
        { label: 'Instagram @joinqadamhub', href: qadamLinks.instagram },
        { label: 'TikTok @qadamhub', href: qadamLinks.tiktok },
      ]}
      sections={[
        {
          heading: 'The problem',
          body: (
            <p>
              Students in Kazakhstan and Central Asia miss most international opportunities for a simple reason: the
              information is scattered across hundreds of sites, and every program has its own eligibility rules and
              deadlines. By the time a student finds a grant and works out whether they qualify, registration is often
              closed.
            </p>
          ),
        },
        {
          heading: 'What I built',
          body: (
            <>
              <p>QADAM is built around three pillars, each a working part of the product.</p>
              <ul>
                <li>
                  <strong>Eligibility radar.</strong> A scheduled GitHub Actions pipeline runs four searches a day,
                  extracts opportunities in batches and merges them into the existing feed instead of overwriting it.
                  Items without a deadline expire after 21 days, and a missing deadline reads &ldquo;see official
                  page&rdquo; rather than a guess.
                </li>
                <li>
                  <strong>CV and Skill Lab.</strong> A CV is benchmarked against a target role: ATS keyword density, a
                  health score and the skills that are missing. Short five question tests turn claimed skills into
                  verified ones.
                </li>
                <li>
                  <strong>Messenger alerts.</strong> A Telegram bot and a Discord server deliver new matches and deadline
                  reminders, and a KakaoTalk channel chatbot is in progress. Webhooks are filtered on the
                  server, so no personal data leaves the platform.
                </li>
              </ul>
              <p className="mt-3">
                Around them: a shared teammates network on Supabase with email one time passwords, an application
                studio that opens the exact opportunity to prepare for, and a Discord community with onboarding roles.
              </p>
            </>
          ),
        },
        {
          heading: 'Engineering decisions',
          body: (
            <ul>
              <li>Merging each radar scan into the previous feed keeps good items alive between runs and makes the feed stable for users.</li>
              <li>Bots run on an Oracle Cloud VM, separate from the web app on Vercel, so a bot restart never touches the site.</li>
              <li>Database migrations are plain SQL files applied in order, which keeps the shared network auditable.</li>
            </ul>
          ),
        },
        {
          heading: 'Brand and launch',
          body: (
            <p>
              I designed the brand myself: a Q whose ring rises into an upward arrow, in navy, ivory and gold. The launch
              includes Instagram carousels and short vertical videos with a voiceover, rendered from code so they can be
              updated as the product changes.
            </p>
          ),
        },
      ]}
    />
  )
}
