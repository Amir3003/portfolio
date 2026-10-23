import { ArrowRight, ArrowUpRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { TICKET, giantWord, ticketText } from '@/components/section-heading'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SkyBackground } from '@/components/sky/sky-background'
import { PROJECTS, projectJsonLd, type ProjectSeo } from '@/lib/seo'
import './sections.css'

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
 * Same boarding pass world as the home page, but calm: the sky stands still at dusk,
 * a paper ticket carries the facts and the long text sits on a solid paper sheet.
 */
export function ProjectCase({ project, lead, role, status, stack, sections, links }: ProjectCaseProps) {
  const others = PROJECTS.filter((p) => p.slug !== project.slug)

  return (
    <div style={{ ...ticketText, color: TICKET.ink }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(projectJsonLd(project)) }}
      />
      {/* The same sky as the home page, held still at dusk. */}
      <SkyBackground fixedTime={0.62} />
      <SiteHeader base="/" />
      <main id="main" className="relative z-[1]">
        <div className="px-4 pt-24 pb-10 sm:px-8 sm:pt-28 sm:pb-14">
          <div className="mx-auto max-w-5xl">
            <nav
              aria-label="Breadcrumb"
              className="inline-block max-w-full rounded-full bg-[#0C2633]/75 px-4 py-1.5 text-sm font-medium text-[#F6F4EE] backdrop-blur-sm"
            >
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
            <header className="mt-5 grid grid-cols-1 overflow-hidden rounded-[28px] bg-[#F6F4EE] shadow-[0_40px_80px_-40px_rgba(2,10,20,0.75)] lg:grid-cols-[minmax(0,1fr)_17rem]">
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

        <div className="px-4 pb-24 sm:px-8">
          <div className="tk-sheet mx-auto max-w-5xl p-3 pb-12 sm:p-4 sm:pb-16">
            <figure className="overflow-hidden rounded-[18px] bg-white p-1.5 ring-1 ring-[#0C2633]/10 sm:p-2">
              <Image
                src={project.image}
                alt={project.imageAlt}
                width={1600}
                height={900}
                priority
                className="h-auto w-full rounded-xl"
              />
            </figure>

            <div className="mx-auto mt-12 flex max-w-[40rem] flex-col gap-12 px-2 sm:mt-16 sm:px-4 text-pretty text-[17px] leading-[1.7] text-[#0C2633]/85 [&_li]:ml-5 [&_li]:list-disc [&_li]:marker:text-[#006A7A] [&_strong]:font-bold [&_strong]:text-[#0C2633] [&_ul]:mt-3 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-2.5">
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

            <aside className="mx-auto mt-16 max-w-[40rem] px-2 sm:mt-20 sm:px-4">
              <div aria-hidden="true" className="tk-perf mb-10 text-[#0C2633]/25" />
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
        </div>
      </main>
      <div className="relative z-[1]">
        <SiteFooter />
      </div>
    </div>
  )
}
