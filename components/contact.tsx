import { SectionHeading } from '@/components/section-heading'
import { SectionVignette } from '@/components/section-vignette'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { contactGroups } from '@/lib/site'

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative scroll-mt-24 px-4 py-24">
      <SectionVignette tone="lime" anchor="center" />
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          id="contact-title"
          title="Get in touch."
          description="Write to me directly, or reach QADAM through its work accounts. Freelance projects through Freelance.kz and Freelancer."
        />
        <div className="flex flex-col gap-10">
          {contactGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-3 font-mono text-xs text-lime-400">{group.title}</h3>
              <ul className="grid grid-cols-1 divide-y divide-neutral-800 border-y border-neutral-700 sm:grid-cols-2 sm:divide-y-0">
                {group.items.map((s) => {
                  const external = s.href.startsWith('http')
                  return (
                    <li key={s.href} className="sm:border-b sm:border-neutral-800 sm:[&:nth-last-child(-n+2)]:border-b-0">
                      <a
                        href={s.href}
                        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                        className="group flex items-center justify-between gap-4 px-4 py-4 text-neutral-200 transition-colors hover:bg-neutral-900 hover:text-lime-300 active:bg-neutral-900 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-lime-400"
                      >
                        <span className="text-base font-medium">{s.label}</span>
                        <span className="flex min-w-0 items-center gap-2 font-mono text-xs text-neutral-400 group-hover:text-neutral-200">
                          <span className="truncate">{s.handle}</span>
                          {external ? (
                            <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
                          ) : (
                            <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
                          )}
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
