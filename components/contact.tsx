import { SectionHeading } from '@/components/section-heading'
import { SectionVignette } from '@/components/section-vignette'
import { socials } from '@/lib/site'

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative scroll-mt-24 px-4 py-24">
      <SectionVignette tone="lime" anchor="center" />
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          id="contact-title"
          eyebrow="Contact"
          title="Get in touch."
          description="Reach me on Telegram, GitHub, LinkedIn, Instagram, or hire me through Freelance.kz and Freelancer."
        />
        <ul className="grid grid-cols-1 divide-y divide-neutral-800 border-y border-neutral-700 sm:grid-cols-2 sm:divide-y-0">
          {socials.map((s) => (
            <li key={s.label} className="sm:border-b sm:border-neutral-800 sm:[&:nth-last-child(-n+2)]:border-b-0">
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-between gap-4 px-4 py-4 text-neutral-200 transition-colors hover:bg-neutral-900 hover:text-lime-300 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-lime-400"
              >
                <span className="text-base font-medium">{s.label}</span>
                <span className="flex items-center gap-2 font-mono text-xs text-neutral-500 group-hover:text-neutral-300">
                  {s.handle}
                  <span aria-hidden="true">↗</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
