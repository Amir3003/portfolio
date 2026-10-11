import { SectionHeading } from '@/components/section-heading'
import { SectionVignette } from '@/components/section-vignette'
import { Terminal } from '@/components/terminal'

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="relative scroll-mt-24 px-4 py-24">
      <SectionVignette tone="lime" anchor="center" />
      <div
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 mx-auto h-72 max-w-3xl rounded-full bg-lime-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          id="contact-title"
          eyebrow="Contact"
          title="Open a session."
          description="Prefer the command line? Query the node directly - or type socials to reach me on Telegram, GitHub, LinkedIn or Freelance.kz."
        />
        <Terminal />
      </div>
    </section>
  )
}
