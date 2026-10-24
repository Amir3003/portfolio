import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { Barcode, SectionHeading, TICKET, fieldLabel, giantWord, ticketText } from '@/components/section-heading'
import { contactGroups } from '@/lib/site'
import './sections.css'

/** Each contact group is a baggage tag: paper for personal, sun gold for QADAM work. */
const TAGS = [
  { code: 'AN', note: 'Personal', face: TICKET.paper, foot: '#E9E6DC' },
  { code: 'QDM', note: 'QADAM', face: TICKET.sun, foot: '#EDB60A' },
] as const

export function Contact() {
  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="relative scroll-mt-24 px-4 py-28 sm:px-8"
      style={ticketText}
    >
      <div className="mx-auto max-w-6xl">
        <div className="sky-copy">
          <SectionHeading
            id="contact-title"
            eyebrow="Final leg · Baggage claim"
            title="Get in touch."
            description="Write to me directly, or reach QADAM through its work accounts. Freelance projects through Freelance.kz and Freelancer."
          />
        </div>
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
          {contactGroups.map((group, gi) => {
            const tag = TAGS[gi % TAGS.length]
            const headingId = `contact-group-${gi}`
            return (
              <section key={group.title} aria-labelledby={headingId} className="tk-lift relative flex flex-col text-[#0C2633]">
                {/* Tag top: punched eyelet, carrier code and the group name. */}
                <div
                  className="tk-part-top flex items-start justify-between gap-4 rounded-t-[22px] px-6 pt-6 pb-6 sm:px-7"
                  style={{ background: tag.face }}
                >
                  <div className="flex min-w-0 flex-col gap-2">
                    <p className={`${fieldLabel} text-[#0C2633]/70`}>Baggage tag · NQZ to NRT</p>
                    <h3
                      id={headingId}
                      className="text-[clamp(1.6rem,4vw,2.25rem)] uppercase"
                      style={{ ...giantWord, fontStretch: '125%', lineHeight: 1 }}
                    >
                      {group.title}
                    </h3>
                  </div>
                  <span
                    aria-hidden="true"
                    className="mt-1 grid size-11 shrink-0 place-items-center rounded-full border-2 border-[#0C2633]/25 bg-[#0C2633]/[0.06]"
                  >
                    <span className="size-4 rounded-full bg-[#0C2633]/80" />
                  </span>
                </div>

                {/* Tear-off line between the tag and its stub of links. */}
                <div aria-hidden="true" className="relative h-0">
                  <span className="absolute inset-x-5 -top-px border-t-2 border-dashed border-[#0C2633]/30" />
                </div>

                <div className="tk-part-bottom flex flex-1 flex-col rounded-b-[22px]" style={{ background: tag.face }}>
                  <ul className="flex flex-1 flex-col px-3 pt-3 pb-2 sm:px-4">
                    {group.items.map((s) => {
                      const external = s.href.startsWith('http')
                      return (
                        <li key={s.href} className="border-b border-[#0C2633]/12 last:border-b-0">
                          <a
                            href={s.href}
                            {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                            className="group flex min-h-12 items-center justify-between gap-4 rounded-xl px-3 py-3 transition-colors duration-150 hover:bg-[#0C2633] hover:text-[#F6F4EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2633] motion-reduce:transition-none"
                          >
                            <span className="text-base font-bold">{s.label}</span>
                            <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-[#0C2633]/75 group-hover:text-[#F6F4EE]/85">
                              <span className="truncate">{s.handle}</span>
                              {external ? (
                                <ArrowUpRight className="size-4 shrink-0" aria-hidden="true" />
                              ) : (
                                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
                              )}
                            </span>
                          </a>
                        </li>
                      )
                    })}
                  </ul>

                  {/* Tag foot: barcode strip and claim number. */}
                  <div
                    aria-hidden="true"
                    className="flex items-center justify-between gap-4 rounded-b-[22px] px-6 py-4 sm:px-7"
                    style={{ background: tag.foot }}
                  >
                    <Barcode code={`${tag.code}2029${tag.note}`} className="h-7 w-32 opacity-85" />
                    <span className={`${fieldLabel} text-[#0C2633]/70`}>
                      {tag.code} 2029 · {tag.note}
                    </span>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </section>
  )
}
