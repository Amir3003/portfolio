import { ArrowUpRight, FolderGit2 as Github, MapPin } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { SectionVignette } from '@/components/section-vignette'
import { zariLinks } from '@/lib/site'

const specs = ['FastAPI', 'Pydantic v2', 'SQLite WAL', 'async / await', '60+ seeded entities']

const metrics = [
  { label: 'p99 latency', value: '< 45ms', tone: 'text-lime-400' },
  { label: 'Seeded entities', value: '60+', tone: 'text-red-400' },
  { label: 'Regions', value: 'KZ-wide', tone: 'text-neutral-100' },
  { label: 'Layout', value: 'Responsive', tone: 'text-neutral-100' },
]

const sampleResults = [
  { name: 'Charyn Canyon', region: 'Almaty Region', score: 0.97 },
  { name: 'Burabay National Park', region: 'Akmola Region', score: 0.94 },
  { name: 'Baiterek Tower', region: 'Astana', score: 0.91 },
]

export function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-title" className="relative scroll-mt-24 px-4 py-24">
      <SectionVignette tone="red" anchor="right" />
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          id="projects-title"
          index="03"
          eyebrow="Projects"
          title="Voyage AI MVP"
          description="An asynchronous travel recommendation engine for discovering places across Kazakhstan."
        />

        <article className="glass relative overflow-hidden rounded-3xl">
          <div
            className="pointer-events-none absolute -left-32 top-0 size-80 rounded-full bg-red-400/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="grid gap-px bg-neutral-800 lg:grid-cols-5">
            <div className="flex flex-col gap-6 bg-neutral-950/80 p-6 sm:p-8 lg:col-span-3">
              <div className="flex items-center gap-3">
                <span className="rounded-md border border-lime-500/30 bg-lime-500/10 px-2 py-0.5 font-mono text-[11px] uppercase tracking-widest text-lime-300">
                  MVP · Live
                </span>
                <span className="font-mono text-xs text-neutral-500">v0.3.1</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-neutral-50">Voyage AI</h3>
                <p className="mt-3 text-pretty leading-relaxed text-neutral-400">
                  A fully async FastAPI service that ranks destinations by user preferences. Strict Pydantic v2 models
                  validate every request, while SQLite in WAL mode allows concurrent reads during writes — keeping tail
                  latency flat under load.
                </p>
              </div>

              <ul className="flex flex-wrap gap-2" aria-label="Tech stack">
                {specs.map((spec) => (
                  <li
                    key={spec}
                    className="rounded-md border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 font-mono text-xs text-neutral-300"
                  >
                    {spec}
                  </li>
                ))}
              </ul>

              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-3">
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">{m.label}</dt>
                    <dd className={`mt-1 text-lg font-semibold ${m.tone}`}>{m.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-auto flex flex-col gap-3 sm:flex-row">
                <a
                  href={zariLinks.repo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-700 bg-neutral-900 px-5 py-2.5 text-sm font-medium text-neutral-100 transition-colors hover:border-neutral-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
                >
                  <Github className="size-4" aria-hidden="true" />
                  GitHub Repository
                </a>
                <a
                  href={zariLinks.demo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-lime-500 px-5 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-lime-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
                >
                  Live Demo
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-4 bg-neutral-950/60 p-6 sm:p-8 lg:col-span-2" aria-label="Sample API response">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-neutral-400">
                  <span className="text-red-400">GET</span> /v1/recommend?vibe=nature
                </span>
                <span className="text-lime-400">200 · 38ms</span>
              </div>
              <ol className="flex flex-col gap-2">
                {sampleResults.map((r, i) => (
                  <li
                    key={r.name}
                    className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-3"
                  >
                    <span className="font-mono text-xs text-neutral-600">0{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-neutral-100">{r.name}</p>
                      <p className="flex items-center gap-1 text-xs text-neutral-500">
                        <MapPin className="size-3" aria-hidden="true" />
                        {r.region}
                      </p>
                    </div>
                    <span className="font-mono text-xs text-lime-300">{r.score.toFixed(2)}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-auto rounded-xl border border-neutral-800 bg-neutral-900/40 p-3 font-mono text-[11px] leading-relaxed text-neutral-500">
                <p>
                  latency.p50 <span className="float-right text-neutral-300">12ms</span>
                </p>
                <p>
                  latency.p95 <span className="float-right text-neutral-300">31ms</span>
                </p>
                <p>
                  latency.p99 <span className="float-right text-lime-400">44ms</span>
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}
