import Link from 'next/link'
import { CookieSettingsButton } from '@/components/legal/consent'
import { TICKET, giantWord, ticketText } from '@/components/section-heading'
import { legal } from '@/lib/legal'

const legalLink =
  '-my-3 inline-block py-3 underline decoration-[#F6F4EE]/35 underline-offset-4 hover:text-[#F6F4EE] hover:decoration-[#F6F4EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEC50C]'

/**
 * The back of the ticket: arrival in Tokyo. The name returns large, then the legal links.
 * `solid` gives it its own ink background for pages without the sky behind them.
 */
export function SiteFooter({ solid = false }: { solid?: boolean }) {
  return (
    <footer
      className="relative px-4 pt-16 pb-10 sm:px-8"
      style={{
        ...ticketText,
        // Over the sky, a soft ink wash keeps the legal line readable against the lit Tokyo haze.
        background: solid ? TICKET.ink : 'linear-gradient(180deg, rgba(7,21,40,0) 0%, rgba(7,21,40,0.55) 45%, rgba(7,21,40,0.85) 100%)',
        color: TICKET.paper,
      }}
    >
      <div className="mx-auto max-w-6xl">
        {/* Tear line between the trip and its back side. */}
        <div aria-hidden="true" className="border-t-2 border-dashed border-[#F6F4EE]/25" />

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: TICKET.sky }}>
            Arrived · Tokyo Narita
          </p>
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-[#F6F4EE]/85">
            <span aria-hidden="true" className="size-2 rounded-full" style={{ background: TICKET.sun }} />
            NQZ to NRT · 28 AUG 2029
          </p>
        </div>

        <p
          aria-hidden="true"
          className="mt-4 text-[clamp(2.6rem,11.2vw,10.5rem)] uppercase"
          style={{ ...giantWord, color: TICKET.paper }}
        >
          Amir Nagiyev
        </p>

        <div className="mt-12 flex flex-col gap-5 text-sm text-[#F6F4EE]/70 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {legal.operator} · {legal.address}
          </p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              <li>
                <Link href="/privacy" className={legalLink}>
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={legalLink}>
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/refund" className={legalLink}>
                  Refunds
                </Link>
              </li>
              <li>
                <Link href="/privacy#data-request" className={legalLink}>
                  Data request
                </Link>
              </li>
              <li className="[&>button]:-my-3 [&>button]:py-3 [&>button]:decoration-[#F6F4EE]/35 [&>button]:hover:text-[#F6F4EE]">
                <CookieSettingsButton />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  )
}
