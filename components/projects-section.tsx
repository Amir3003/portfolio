import { ArrowRight } from 'lucide-react'
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
          title="Case studies."
          description="What each project solves, how it is built and where it stands."
        />
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PROJECTS.map((p) => (
            <li key={p.slug}>
              <Link
                href={p.path}
                className="group flex h-full flex-col border border-neutral-800 bg-neutral-950 transition-[border-color,transform] duration-150 ease-out hover:border-neutral-600 active:scale-[0.99] motion-reduce:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
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
                  <span className="flex items-center justify-between gap-3 text-lg font-medium text-neutral-50 group-hover:text-lime-300">
                    {p.name} case study
                    <ArrowRight
                      className="size-4 shrink-0 text-neutral-500 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-lime-300 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-pretty text-sm leading-relaxed text-neutral-400">{p.description}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
