import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { SiteHeader } from '@/components/site-header'
import { PROJECTS, projectJsonLd, type ProjectSeo } from '@/lib/seo'

export interface CaseSection {
  heading: string
  body: ReactNode
}

interface ProjectCaseProps {
  project: ProjectSeo
  lead: string
  role: string
  status: string
  stack: readonly string[]
  sections: readonly CaseSection[]
  links: ReadonlyArray<{ label: string; href: string }>
}

/**
 * Case study page for one project: task, solution, stack and status, with a screenshot.
 * Server rendered, so the whole text is in the HTML that search engines fetch.
 */
export function ProjectCase({ project, lead, role, status, stack, sections, links }: ProjectCaseProps) {
  const others = PROJECTS.filter((p) => p.slug !== project.slug)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd(project)) }}
      />
      <SiteHeader base="/" />
      <main id="main" className="mx-auto max-w-4xl px-4 pt-24 pb-20">
        <nav aria-label="Breadcrumb" className="font-mono text-xs text-neutral-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="underline-offset-4 hover:text-neutral-200 hover:underline">
                Amir Nagiyev
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/#projects" className="underline-offset-4 hover:text-neutral-200 hover:underline">
                Projects
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-neutral-300">{project.name}</li>
          </ol>
        </nav>

        <header className="mt-8 flex flex-col gap-4">
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-neutral-50 sm:text-5xl">
            {project.name}
          </h1>
          <p className="max-w-[38rem] text-pretty text-lg leading-relaxed text-neutral-300">{lead}</p>
          <div className="flex flex-wrap gap-2 pt-2">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className={
                  i === 0
                    ? 'inline-flex items-center gap-2 bg-lime-400 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-lime-300'
                    : 'inline-flex items-center gap-2 border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-neutral-500'
                }
              >
                {l.label}
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </header>

        <figure className="mt-10 overflow-hidden border border-neutral-800 bg-neutral-900">
          <Image
            src={project.image}
            alt={project.imageAlt}
            width={1600}
            height={900}
            priority
            className="h-auto w-full"
          />
        </figure>

        <dl className="mt-10 grid grid-cols-1 divide-y divide-neutral-800 border-y border-neutral-700 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="p-4">
            <dt className="font-mono text-xs text-neutral-400">Role</dt>
            <dd className="mt-1 text-sm text-neutral-200">{role}</dd>
          </div>
          <div className="p-4">
            <dt className="font-mono text-xs text-neutral-400">Status</dt>
            <dd className="mt-1 text-sm text-neutral-200">{status}</dd>
          </div>
          <div className="p-4">
            <dt className="font-mono text-xs text-neutral-400">Stack</dt>
            <dd className="mt-1 text-sm text-neutral-200">{stack.join(', ')}</dd>
          </div>
        </dl>

        <div className="mt-12 flex max-w-[36rem] flex-col gap-12 text-pretty text-[15px] leading-relaxed text-neutral-300 [&_li]:ml-5 [&_li]:list-disc [&_ul]:mt-3 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_strong]:text-neutral-100">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className="mb-3 text-balance text-xl font-medium text-neutral-50">{s.heading}</h2>
              {s.body}
            </section>
          ))}
        </div>

        <aside className="mt-16 border-t border-neutral-800 pt-8">
          <h2 className="text-lg font-medium text-neutral-50">More projects</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {others.map((p) => (
              <li key={p.slug}>
                <Link href={p.path} className="group flex flex-col gap-1 border border-neutral-800 p-4 hover:border-neutral-600">
                  <span className="flex items-center justify-between gap-3 text-base font-medium text-neutral-100 group-hover:text-lime-300">
                    {p.name} case study
                    <ArrowRight
                      className="size-4 shrink-0 text-neutral-500 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-lime-300 motion-reduce:transition-none"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-pretty text-sm text-neutral-400">{p.description}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/#contact" className="-my-3 inline-block py-3 font-mono text-xs text-neutral-400 underline underline-offset-4 hover:text-neutral-200">
                Contact Amir Nagiyev
              </Link>
            </li>
          </ul>
        </aside>
      </main>
    </>
  )
}
