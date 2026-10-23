import { Contact } from '@/components/contact'
import { ProjectsSection } from '@/components/projects-section'
import { StoryLaptop } from '@/components/laptop/story-laptop'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SkyBackground } from '@/components/sky/sky-background'
import { BoardingPass } from '@/components/ticket/boarding-pass'
import { profilePageJsonLd } from '@/lib/seo'

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(profilePageJsonLd()) }} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:bg-[#FEC50C] focus:px-3 focus:py-2 focus:text-[#0C2633]"
      >
        Skip to content
      </a>
      {/* One fixed sky behind the whole page: day over Astana, night over Tokyo by the end. */}
      <SkyBackground />
      <SiteHeader />
      <main id="main" className="relative z-[1]">
        {/* Hero: the boarding pass. Scrolling tears off the stub, then the laptop story takes over. */}
        <section id="top" data-hero="" aria-labelledby="hero-title" className="hero-flight">
          <div className="hero-flight__pin">
            <h1 id="hero-title" className="hero-flight__title">
              <span className="hero-flight__name">
                Amir Nagiyev<span className="hero-flight__comma">,</span>
              </span>{' '}
              <span className="hero-flight__role">
                <span className="hero-flight__dot" aria-hidden="true" />
                AI &amp; ML developer from Astana
              </span>
            </h1>
            <div className="hero-flight__ticket">
              <BoardingPass />
            </div>
          </div>
        </section>
        <StoryLaptop />
        <ProjectsSection />
        <Contact />
      </main>
      <div className="relative z-[1]">
        <SiteFooter />
      </div>
    </>
  )
}
