import { About } from '@/components/about'
import { AmbientBackground } from '@/components/ambient-background'
import { Contact } from '@/components/contact'
import { CursorGlow } from '@/components/cursor-glow'
import { FloatingContact } from '@/components/floating-contact'
import { Hero } from '@/components/hero'
import { Projects } from '@/components/projects'
import { SiteHeader } from '@/components/site-header'
import { SkillsBento } from '@/components/skills-bento'

export default function Page() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-lime-500 focus:px-3 focus:py-2 focus:text-neutral-950"
      >
        Skip to content
      </a>
      <AmbientBackground />
      <CursorGlow />
      <SiteHeader />
      <FloatingContact />
      <main id="main">
        <Hero />
        <About />
        <SkillsBento />
        <Projects />
        <Contact />
      </main>
      <footer className="border-t border-neutral-800 px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 font-mono text-xs text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Amir Nagiyev · Astana, KZ</p>
          <p>
            <span className="text-lime-400">●</span> all systems operational
          </p>
        </div>
      </footer>
    </>
  )
}
