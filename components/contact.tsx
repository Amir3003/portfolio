import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { SectionHeading, TICKET, giantWord, ticketText } from '@/components/section-heading'
import { contactGroups } from '@/lib/site'

/** Each contact group is a baggage tag: paper for personal, sun gold for QADAM work. */
const TAGS = [
  { code: 'AN', note: 'Personal', face: TICKET.paper },
  { code: 'QDM', note: 'QADAM', face: TICKET.sun },
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
        <SectionHeading
          id="contact-title"
          eyebrow="Final leg · Baggage claim"
          title="Get in touch."
          description="Write to me directly, or reach QADAM through its work accounts. Freelance projects through Freelance.kz and Freelancer."
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          {contactGroups.map((group, gi) => {
            const tag = TAGS[gi % TAGS.length]
            const headingId = `contact-group-${gi}`
            return (
              <section
                key={group.title}
                aria-labelledby={headingId}
                className="relative flex flex-col rounded-[22px] text-[#0C2633] shadow-[0_30px_60px_-28px_rgba(2,10,20,0.75)]"
                style={{ background: tag.face }}
              >
                {/* Tag top: punched eyelet, carrier code and the group name. */}
                <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 sm:px-7">
                  <div className="flex flex-col gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0C2633]/70">
                      Baggage tag · NQZ to NRT
                    </p>
                    <h3 id={headingId} className="text-[clamp(1.75rem,4vw,2.25rem)] uppercase" style={{ ...giantWord, fontStretch: '125%', lineHeight: 1 }}>
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

                {/* Perforation, like a tear-off stub. */}
                <div aria-hidden="true" className="relative h-0">
                  <span className="absolute inset-x-6 top-0 border-t-2 border-dashed border-[#0C2633]/25" />
                </div>

                <ul className="flex flex-1 flex-col px-3 py-3 sm:px-4">
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
                <div aria-hidden="true" className="flex items-center justify-between gap-4 rounded-b-[22px] bg-[#0C2633]/[0.06] px-6 py-4 sm:px-7">
                  <span
                    className="h-7 w-32 opacity-80"
                    style={{
                      background:
                        'repeating-linear-gradient(90deg, #0C2633 0 2px, transparent 2px 4px, #0C2633 4px 5px, transparent 5px 8px, #0C2633 8px 11px, transparent 11px 13px)',
                    }}
                  />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0C2633]/70">
                    {tag.code} 2029 · {tag.note}
                  </span>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </section>
  )
}
