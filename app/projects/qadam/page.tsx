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
      lead="QADAM («Қадам») means step in Kazakh. It finds the grants, hackathons, scholarships and internships a student can actually get, publishes each one only with a deadline quoted from the organizer's own page, shows what is missing in their CV, and sends the deadlines to Telegram and Discord. Free for students, with a workspace for schools."
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
                  <strong>Opportunity radar.</strong> A daily GitHub Actions scan runs five targeted searches with a
                  balanced source budget and merges the results into the existing feed instead of overwriting it. A
                  listing goes live only with a confirmed future deadline and a quote from the organizer&apos;s page, and
                  expired ones drop out. A hand-checked catalog of programs (US, UK, Germany, wider Europe, Hungary,
                  Singapore, Turkey, Australia, plus internships and hackathons) sits next to the scan, and a weekly job
                  checks its links, past deadlines and stale verification dates. Students pick destinations in their
                  profile and the radar shows those first.
                </li>
                <li>
                  <strong>CV and Skill Lab.</strong> A CV is benchmarked against a target role: ATS keyword density, a
                  health score and the skills that are missing. 235 skill quizzes (10 random questions, pass at 7) turn
                  claimed skills into verified ones.
                </li>
                <li>
                  <strong>Messenger alerts.</strong> The Telegram bot sends a daily note at 09:00 Astana time, only when
                  something new appeared, and reminders 7, 3 and 1 day before the deadline of any listing a student tracks.
                  The Discord server gets the radar too. Both are opt in, and the bot keeps only what a student asked it
                  to send them.
                </li>
              </ul>
              <p className="mt-3">
                Around them: Application Prep, a compact checklist that opens one step at a time and ticks a step when its
                official page is opened; a shared teammates network on Supabase with email code sign-in, where a profile
                stays on the device until the student chooses to join; an in-app feedback button; and a schools workspace
                with cohorts, invite links, a roster with application statuses and a CSV export.
              </p>
            </>
          ),
        },
        {
          heading: 'Engineering decisions',
          body: (
            <ul>
              <li>Merging each radar scan into the previous feed keeps good items alive between runs and makes the feed stable for users.</li>
              <li>A listing without a quoted source and a confirmed deadline is not published, so the feed stays smaller but every date can be checked.</li>
              <li>Bots run on an Oracle Cloud VM with no dependencies, separate from the web app on Vercel, so a bot restart never touches the site.</li>
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
