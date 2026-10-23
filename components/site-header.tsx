import { ticketText } from '@/components/section-heading'
import { navItems } from '@/lib/site'

const link =
  'inline-flex min-h-11 items-center rounded-full px-2.5 text-[13px] font-semibold sm:px-3 sm:text-sm text-[#0C2633] transition-colors duration-150 hover:bg-[#0C2633]/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0C2633] motion-reduce:transition-none'

/**
 * Solid paper pills read the same over the bright day sky and the night sky.
 * `base` prefixes the in-page anchors; pages other than home pass '/'.
 */
export function SiteHeader({ base = '' }: { base?: string }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-4" style={ticketText}>
      <nav aria-label="Primary" className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <a
          href={`${base}#top`}
          className="pointer-events-auto grid size-11 shrink-0 place-items-center rounded-full bg-[#0C2633] text-[15px] font-extrabold tracking-[0.02em] text-[#F6F4EE] shadow-[0_6px_20px_-8px_rgba(2,10,20,0.6)] ring-2 ring-[#F6F4EE] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FEC50C]"
        >
          <span aria-hidden="true">AN</span>
          <span className="sr-only">Amir Nagiyev, back to top</span>
        </a>
        <ul className="pointer-events-auto flex items-center rounded-full bg-[#F6F4EE] p-1 shadow-[0_6px_20px_-8px_rgba(2,10,20,0.45)] ring-1 ring-[#0C2633]/10">
          {navItems.map((item) => (
            <li
              key={item.href}
              className={item.href === '#architecture' || item.href === '#about' ? 'hidden sm:block' : undefined}
            >
              <a href={`${base}${item.href}`} className={link}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
