import { ArrowDown, TerminalSquare } from 'lucide-react'
import { SocialBadges } from '@/components/social-badges'
import { TerminalCta } from '@/components/terminal-cta'

export function Hero() {
  return (
    <section
      id="top"
      aria-labelledby="hero-title"
      className="flex min-h-svh items-center px-4 pb-20 pt-32"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col items-start gap-8">
        <p className="glass inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs text-neutral-300">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-lime-500" />
          </span>
          17-year-old Undergraduate Student based in Astana, Kazakhstan
        </p>

        <h1
          id="hero-title"
          className="max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-tight text-neutral-50 sm:text-6xl md:text-7xl"
        >
          Amir Nagiyev
          <span className="text-neutral-600"> — </span>
          <span className="bg-gradient-to-r from-lime-400 via-lime-300 to-red-400 bg-clip-text text-transparent">
            AI & ML Engineer
          </span>{' '}
          & Systems Architect
        </h1>

        <p className="max-w-xl text-pretty text-lg leading-relaxed text-neutral-400">
          Building neural networks on top of a low-level mindset — from tensor graphs in PyTorch to
          zero-allocation hot paths in Go.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="#projects"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-lime-500 px-6 py-3 text-sm font-medium text-neutral-950 shadow-[0_0_32px_-6px] shadow-lime-500/70 transition-colors hover:bg-lime-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
          >
            Explore Projects
            <ArrowDown className="size-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
          </a>
          <TerminalCta className="glass inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 font-mono text-sm text-red-300 transition-colors hover:border-red-400/50 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400">
            <TerminalSquare className="size-4" aria-hidden="true" />
            Initialize Terminal
          </TerminalCta>
        </div>

        <dl className="mt-6 grid w-full max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-800">
          {[
            { label: 'Focus', value: 'AI / ML' },
            { label: 'Core lang', value: 'Go · Py' },
            { label: 'Target', value: 'JLPT N2' },
          ].map((stat) => (
            <div key={stat.label} className="bg-neutral-950/80 px-4 py-4">
              <dt className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">{stat.label}</dt>
              <dd className="mt-1 text-base font-medium text-neutral-100 sm:text-lg">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <SocialBadges />
      </div>
    </section>
  )
}
