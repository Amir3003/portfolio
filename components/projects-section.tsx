import Image from 'next/image'
import Link from 'next/link'
import { SectionHeading } from '@/components/section-heading'
import { PROJECTS } from '@/lib/seo'

/** Plain links to the case studies: crawlable internal links with descriptive anchor text. */
export function ProjectsSection() {
  return (
    <section id="projects" aria-labelledby="projects-title" className="relative scroll-mt-24 px-4 pt-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          id="projects-title"
          eyebrow="Projects"
          title="Case studies."
          description="What each project solves, how it is built and where it stands."
        />
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PROJECTS.map((p) => (
            <li key={p.slug}>
              <Link
                href={p.path}
                className="group flex h-full flex-col border border-neutral-800 bg-neutral-950 transition-colors hover:border-neutral-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
              >
                <Image
                  src={p.image}
                  alt={p.imageAlt}
                  width={1600}
                  height={900}
                  loading="lazy"
                  sizes="(min-width: 768px) 480px, 100vw"
                  className="h-auto w-full border-b border-neutral-800"
                />
                <span className="flex flex-1 flex-col gap-2 p-5">
                  <span className="text-lg font-medium text-neutral-50 group-hover:text-lime-300">
                    {p.name} case study
                  </span>
                  <span className="text-sm leading-relaxed text-neutral-400">{p.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
