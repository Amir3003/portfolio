import { navItems } from '@/lib/site'

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <nav
        aria-label="Primary"
        className="glass mx-auto flex max-w-5xl items-center justify-between rounded-full px-4 py-2.5"
      >
        <a href="#top" className="flex items-center gap-2 font-mono text-sm text-neutral-200">
          <span className="size-2 rounded-full bg-lime-500 shadow-[0_0_12px] shadow-lime-500" aria-hidden="true" />
          amir.dev
        </a>
        <ul className="flex items-center gap-1">
          {navItems.map((item) => (
            <li key={item.href} className={item.href === '#stack' ? 'hidden sm:block' : undefined}>
              <a
                href={item.href}
                className="rounded-full px-3 py-1.5 text-sm text-neutral-400 transition-colors hover:bg-neutral-800/60 hover:text-neutral-100"
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
