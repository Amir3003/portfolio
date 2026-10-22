import Link from 'next/link'
import type { ReactNode } from 'react'
import { legal } from '@/lib/legal'

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-16">
      <p className="font-mono text-xs text-neutral-400">
        <Link href="/" className="underline underline-offset-4 hover:text-neutral-300">
          Back to site
        </Link>
      </p>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-neutral-50">{title}</h1>
      <p className="mt-2 font-mono text-xs text-neutral-400">Last updated {legal.lastUpdated}</p>
      <div className="mt-10 flex flex-col gap-8 text-[15px] leading-relaxed text-neutral-300 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-neutral-100 [&_li]:ml-5 [&_li]:list-disc [&_a]:text-neutral-100 [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </main>
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
