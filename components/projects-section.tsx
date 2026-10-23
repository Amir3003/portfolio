import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { SectionHeading, TICKET, giantWord, ticketText } from '@/components/section-heading'
import { PROJECTS } from '@/lib/seo'

/** Itinerary order follows the 3D story: Voyage AI first, then QADAM. */
const ITINERARY: ReadonlyArray<{ slug: string; word: string; size: string; line: string }> = [
  {
    slug: 'voyage-ai',
    word: 'Voyage AI',
    // Two lines on phones (VOYAGE / AI), one line from tablet up; always inside the viewport.
    size: 'text-[clamp(2.75rem,15.5vw,8.5rem)] md:text-[min(12.2vw,12.5rem)]',
    line: 'One sentence in, three priced trips out. Fifty resorts in ten countries.',
  },
  {
    slug: 'qadam',
    word: 'QADAM',
    size: 'text-[clamp(2.75rem,15.5vw,8.5rem)] md:text-[min(14vw,14rem)]',
    line: 'Qadam means step. A radar for the grants, hackathons and internships a student can actually get.',
  },
]

/** Plain links to the case studies: crawlable internal links with descriptive anchor text. */
export function ProjectsSection() {
  const stops = ITINERARY.flatMap((stop) => {
    const project = PROJECTS.find((p) => p.slug === stop.slug)
    return project ? [{ ...stop, project }] : []
  })

  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="relative scroll-mt-24 overflow-x-clip px-4 pt-28 sm:px-8"
      style={ticketText}
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          id="projects-title"
          eyebrow="Itinerary · 2 stops"
          title="Case studies."
          description="What each project solves, how it is built and where it stands."
        />
      </div>

      <ol className="flex flex-col gap-24 sm:gap-32">
        {stops.map(({ project: p, word, size, line }, i) => {
          const flip = i % 2 === 1
          return (
            <li key={p.slug} className="mx-auto w-full max-w-[1600px]">
              <article aria-labelledby={`stop-${p.slug}`} className="flex scroll-mt-28 flex-col">
                <p
                  className={`mx-auto flex w-full max-w-6xl items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] ${flip ? 'flex-row-reverse text-right' : ''}`}
                  style={{ color: TICKET.sky }}
                >
                  <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ background: TICKET.sun }} />
                  <span>
                    Stop {i + 1} · {p.name}
                  </span>
                  <span aria-hidden="true" className="h-px flex-1 border-t border-dashed border-[#F6F4EE]/30" />
                </p>

                <h3
                  id={`stop-${p.slug}`}
                  className={`mt-5 max-w-full break-words uppercase ${size} ${flip ? 'text-right' : ''}`}
                  style={{ ...giantWord, color: TICKET.paper }}
                >
                  {word}
                </h3>

                <div
                  className={`mx-auto mt-8 grid w-full max-w-6xl grid-cols-1 items-center gap-8 md:mt-12 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12 ${flip ? 'md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]' : ''}`}
                >
                  <div className={`flex flex-col gap-6 ${flip ? 'md:order-2 md:items-end md:text-right' : ''}`}>
                    <p className="max-w-[34ch] text-pretty text-xl leading-snug text-[#F6F4EE]/85">{line}</p>
                    <Link
                      href={p.path}
                      className={`group inline-flex min-h-11 items-center gap-3 self-start rounded-full bg-[#F6F4EE] py-2.5 pr-4 pl-5 text-[15px] font-semibold text-[#0C2633] transition-[background-color,transform] duration-150 ease-out hover:bg-white active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FEC50C] motion-reduce:transition-none motion-reduce:active:scale-100 ${flip ? 'md:self-end' : ''}`}
                    >
                      {p.name} case study
                      <span className="grid size-7 place-items-center rounded-full bg-[#0C2633] text-[#F6F4EE]">
                        <ArrowRight
                          className="size-3.5 transition-transform duration-200 ease-out group-hover:translate-x-0.5 motion-reduce:transition-none"
                          aria-hidden="true"
                        />
                      </span>
                    </Link>
                  </div>

                  <figure
                    className={`overflow-hidden rounded-2xl bg-[#F6F4EE] p-1.5 shadow-[0_30px_60px_-24px_rgba(2,10,20,0.7)] sm:p-2 ${flip ? 'md:order-1' : ''}`}
                  >
                    <Image
                      src={p.image}
                      alt={p.imageAlt}
                      width={1600}
                      height={900}
                      loading="lazy"
                      sizes="(min-width: 1152px) 660px, (min-width: 768px) 56vw, 100vw"
                      className="h-auto w-full rounded-xl"
                    />
                  </figure>
                </div>
              </article>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
