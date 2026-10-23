import Link from 'next/link'
import type { ReactNode } from 'react'
import { TICKET, fieldLabel, giantWord, ticketText } from '@/components/section-heading'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SkyBackground } from '@/components/sky/sky-background'
import { legal } from '@/lib/legal'
import '@/components/sections.css'

/**
 * Legal pages live in the same world as the site: the sky stands still at night,
 * and the text sits on a solid paper sheet with a comfortable line length.
 */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh" style={{ ...ticketText, color: TICKET.ink }}>
      <SkyBackground fixedTime={0.9} />
      <SiteHeader base="/" />
      <main id="main" className="relative z-[1] px-4 pt-24 pb-20 sm:px-8 sm:pt-28">
        <article className="tk-sheet mx-auto max-w-3xl px-5 py-8 sm:px-12 sm:py-12">
          <p className="text-sm font-medium text-[#0C2633]/75">
            <Link
              href="/"
              className="-my-3 inline-block py-3 underline underline-offset-4 hover:text-[#0C2633] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2633]"
            >
              Back to site
            </Link>
          </p>
          <h1
            className="mt-4 text-balance text-[clamp(2rem,6vw,3rem)] text-[#0C2633]"
            style={{ ...giantWord, fontStretch: '115%', letterSpacing: '-0.02em', lineHeight: 1.05 }}
          >
            {title}
          </h1>
          <p className={`mt-3 ${fieldLabel}`} style={{ color: TICKET.skyInk }}>
            Last updated {legal.lastUpdated}
          </p>
          <div aria-hidden="true" className="tk-perf mt-8 text-[#0C2633]/20" />
          <div className="mt-8 flex max-w-[65ch] flex-col gap-8 text-[15px] leading-relaxed text-[#0C2633]/85 [&_a]:text-[#0C2633] [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#0C2633] [&_li]:ml-5 [&_li]:list-disc [&_li]:marker:text-[#006A7A] [&_strong]:font-bold [&_strong]:text-[#0C2633]">
            {children}
          </div>
        </article>
      </main>
      <div className="relative z-[1]">
        <SiteFooter />
      </div>
    </div>
  )
}

/** Operator identity block shared by every legal page. Only fields that are configured appear. */
export function OperatorBlock() {
  return (
    <section>
      <h2>Operator</h2>
      <ul>
        <li>{legal.operator}</li>
        {legal.address ? <li>{legal.address}</li> : null}
        {legal.registrationId ? <li>Registration number: {legal.registrationId}</li> : null}
        {legal.contactEmail ? (
          <li>
            Email: <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>
          </li>
        ) : null}
        <li>
          Telegram: <a href={legal.contactTelegram}>@amirnagiyevdev</a>
        </li>
      </ul>
    </section>
  )
}
