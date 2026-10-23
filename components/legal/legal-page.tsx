import Link from 'next/link'
import type { ReactNode } from 'react'
import { TICKET, giantWord, ticketText } from '@/components/section-heading'
import { legal } from '@/lib/legal'

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh" style={{ ...ticketText, background: TICKET.ink }}>
      <main id="main" className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-sm font-medium text-[#F6F4EE]/75">
          <Link
            href="/"
            className="-my-3 inline-block py-3 underline underline-offset-4 hover:text-[#F6F4EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEC50C]"
          >
            Back to site
          </Link>
        </p>
        <h1 className="mt-6 text-balance text-[clamp(2rem,6vw,3rem)] text-[#F6F4EE]" style={{ ...giantWord, fontStretch: '115%', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
          {title}
        </h1>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: TICKET.sky }}>
          Last updated {legal.lastUpdated}
        </p>
        <div className="mt-10 flex flex-col gap-8 text-[15px] leading-relaxed text-[#F6F4EE]/80 [&_a]:text-[#F6F4EE] [&_a]:underline [&_a]:underline-offset-4 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[#F6F4EE] [&_li]:ml-5 [&_li]:list-disc">
          {children}
        </div>
      </main>
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
