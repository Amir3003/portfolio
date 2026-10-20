import Link from 'next/link'
import { AmbientBackground } from '@/components/ambient-background'
import { Contact } from '@/components/contact'
import { CookieSettingsButton } from '@/components/legal/consent'
import { ProjectsSection } from '@/components/projects-section'
import { StoryLaptop } from '@/components/laptop/story-laptop'
import { SiteHeader } from '@/components/site-header'
import { legal } from '@/lib/legal'
import { profilePageJsonLd } from '@/lib/seo'

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd()) }} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-lime-500 focus:px-3 focus:py-2 focus:text-neutral-950"
      >
        Skip to content
      </a>
      <AmbientBackground />
      <SiteHeader />
      <main id="main">
        <StoryLaptop />
        <ProjectsSection />
        <Contact />
      </main>
      <footer className="border-t border-neutral-800 px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 font-mono text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {legal.operator} · {legal.address}
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/privacy" className="underline underline-offset-4 hover:text-neutral-200">
              Privacy
            </Link>
            <Link href="/terms" className="underline underline-offset-4 hover:text-neutral-200">
              Terms
            </Link>
            <Link href="/refund" className="underline underline-offset-4 hover:text-neutral-200">
              Refunds
            </Link>
            <Link href="/privacy#data-request" className="underline underline-offset-4 hover:text-neutral-200">
              Data request
            </Link>
            <CookieSettingsButton />
          </nav>
        </div>
      </footer>
    </>
  )
}
