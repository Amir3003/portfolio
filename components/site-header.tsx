import { navItems } from '@/lib/site'

/** `base` prefixes the in-page anchors; pages other than home pass '/'. */
export function SiteHeader({ base = '' }: { base?: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-neutral-800 bg-neutral-950">
      <nav aria-label="Primary" className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href={`${base}#top`} className="-my-3 inline-block py-3 font-mono text-sm text-neutral-100">
          amir.dev
        </a>
        <ul className="flex items-center gap-4 sm:gap-5">
          {navItems.map((item) => (
            <li
              key={item.href}
              className={item.href === '#architecture' || item.href === '#about' ? 'hidden sm:block' : undefined}
            >
              <a
                href={`${base}${item.href}`}
                className="-my-3 inline-block py-3 text-sm text-neutral-400 underline-offset-4 hover:text-neutral-100 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lime-400"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
