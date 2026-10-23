import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { TICKET, giantWord, ticketText } from '@/components/section-heading'
import { SiteFooter } from '@/components/site-footer'
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

const label = 'text-[11px] font-semibold uppercase tracking-[0.18em]'

/**
 * Case study page for one project: task, solution, stack and status, with a screenshot.
 * Server rendered, so the whole text is in the HTML that search engines fetch.
 * Same boarding pass world as the home page, but calm: a paper ticket over a still day sky,
 * then the body on solid paper.
 */
export function ProjectCase({ project, lead, role, status, stack, sections, links }: ProjectCaseProps) {
  const others = PROJECTS.filter((p) => p.slug !== project.slug)

  return (
    <div style={{ ...ticketText, background: TICKET.paper, color: TICKET.ink }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd(project)) }}
      />
      <SiteHeader base="/" />
      <main id="main">
        {/* Still day sky behind the ticket. */}
        <div
          className="px-4 pt-24 pb-14 sm:px-8 sm:pt-28 sm:pb-20"
          style={{ background: 'linear-gradient(180deg, #0F6FAE 0%, #2B97CF 45%, #8FCFE6 80%, #F6F4EE 100%)' }}
        >
          <div className="mx-auto max-w-5xl">
            <nav aria-label="Breadcrumb" className="text-sm font-medium text-[#F6F4EE]">
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="-my-3 inline-block py-3 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F4EE]">
                    Amir Nagiyev
                  </Link>
                </li>
                <li aria-hidden="true" className="text-[#F6F4EE]/60">/</li>
                <li>
                  <Link href="/#projects" className="-my-3 inline-block py-3 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6F4EE]">
                    Projects
                  </Link>
                </li>
                <li aria-hidden="true" className="text-[#F6F4EE]/60">/</li>
                <li className="text-[#F6F4EE]/85">{project.name}</li>
              </ol>
            </nav>

            {/* The ticket: main part and a stub with role and status. */}
            <header className="mt-6 grid grid-cols-1 overflow-hidden rounded-[28px] bg-[#F6F4EE] shadow-[0_40px_80px_-40px_rgba(6,30,42,0.65)] lg:grid-cols-[minmax(0,1fr)_17rem]">
              <div className="flex flex-col gap-5 p-6 sm:p-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className={label} style={{ color: TICKET.skyInk }}>
                    Case study · Boarding pass
                  </p>
                  <p className={`${label} hidden rounded-full border border-[#0C2633]/25 px-3 py-1.5 text-[#0C2633]/80 sm:block`}>
                    NQZ to NRT
                  </p>
                </div>
                <p className="flex items-center gap-3 text-base font-semibold text-[#0C2633]/80 sm:text-lg">
                  <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: TICKET.sun }} />
                  {project.title}
                </p>
                <h1 className="text-[clamp(2.75rem,9vw,6.5rem)] uppercase" style={giantWord}>
                  {project.name}
                </h1>
                <p className="max-w-[40rem] text-pretty text-lg leading-relaxed text-[#0C2633]/85">{lead}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {links.map((l, i) => (
                    <a
                      key={l.href}
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        (i === 0
                          ? 'bg-[#0C2633] text-[#F6F4EE] hover:bg-[#123445]'
                          : 'border border-[#0C2633]/25 text-[#0C2633] hover:border-[#0C2633]/60') +
                        ' inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2633] motion-reduce:transition-none'
                      }
                    >
                      {l.label}
                      <ArrowUpRight className="size-4" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>

              <dl
                className="grid grid-cols-1 gap-5 border-t-2 border-dashed border-[#0C2633]/20 p-6 sm:grid-cols-3 sm:p-10 lg:grid-cols-1 lg:content-start lg:border-t-0 lg:border-l-2 lg:p-8"
                style={{ background: TICKET.sun }}
              >
                <div>
                  <dt className={`${label} text-[#0C2633]/75`}>Role</dt>
                  <dd className="mt-1.5 text-[15px] font-semibold leading-snug">{role}</dd>
                </div>
                <div>
                  <dt className={`${label} text-[#0C2633]/75`}>Status</dt>
                  <dd className="mt-1.5 text-[15px] font-semibold leading-snug">{status}</dd>
                </div>
                <div>
                  <dt className={`${label} text-[#0C2633]/75`}>Stack</dt>
                  <dd className="mt-1.5 text-[15px] font-semibold leading-snug">{stack.join(', ')}</dd>
                </div>
              </dl>
            </header>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 pb-24 sm:px-8">
          <figure className="overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_24px_60px_-36px_rgba(6,30,42,0.55)] ring-1 ring-[#0C2633]/10 sm:p-2">
            <Image
              src={project.image}
              alt={project.imageAlt}
              width={1600}
              height={900}
              priority
              className="h-auto w-full rounded-xl"
            />
          </figure>

          <div className="mx-auto mt-16 flex max-w-[40rem] flex-col gap-12 text-pretty text-[17px] leading-[1.7] text-[#0C2633]/85 [&_li]:ml-5 [&_li]:list-disc [&_li]:marker:text-[#006A7A] [&_strong]:font-bold [&_strong]:text-[#0C2633] [&_ul]:mt-3 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2.5">
            {sections.map((s) => (
              <section key={s.heading}>
                <h2
                  className="mb-4 text-balance text-[1.75rem] text-[#0C2633]"
                  style={{ ...giantWord, fontStretch: '115%', letterSpacing: '-0.02em', lineHeight: 1.1, fontWeight: 800 }}
                >
                  {s.heading}
                </h2>
                {s.body}
              </section>
            ))}
          </div>

          <aside className="mx-auto mt-20 max-w-[40rem] border-t-2 border-dashed border-[#0C2633]/20 pt-10">
            <h2 className={label} style={{ color: TICKET.skyInk }}>
              More projects · Next stop
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              {others.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={p.path}
                    className="group flex flex-col gap-1.5 rounded-2xl bg-[#0C2633] p-5 text-[#F6F4EE] transition-colors duration-150 hover:bg-[#123445] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2633] motion-reduce:transition-none sm:p-6"
                  >
                    <span className="flex items-center justify-between gap-3 text-lg font-bold">
                      {p.name} case study
                      <ArrowRight
                        className="size-4 shrink-0 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </span>
                    <span className="text-pretty text-sm leading-relaxed text-[#F6F4EE]/75">{p.description}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/#contact"
                  className="-my-1 inline-block py-3 text-sm font-semibold text-[#0C2633] underline underline-offset-4 hover:text-[#006A7A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2633]"
                >
                  Contact Amir Nagiyev
                </Link>
              </li>
            </ul>
          </aside>
        </div>
      </main>
      <SiteFooter solid />
    </div>
  )
}
