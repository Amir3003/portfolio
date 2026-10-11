import { Cpu, Globe, Network, Wrench } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'
import { SectionVignette } from '@/components/section-vignette'

function Chips({ items, tone }: { items: string[]; tone: 'lime' | 'red' | 'neutral' }) {
  const toneClass = {
    lime: 'border-lime-500/20 bg-lime-500/5 text-lime-300',
    red: 'border-red-400/20 bg-red-400/5 text-red-300',
    neutral: 'border-neutral-800 bg-neutral-950/60 text-neutral-300',
  }[tone]
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className={`rounded-md border px-2 py-1 font-mono text-xs ${toneClass}`}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function TileHeader({ icon: Icon, label, title }: { icon: typeof Cpu; label: string; title: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">{label}</p>
        <h3 className="mt-1 text-xl font-medium text-neutral-100">{title}</h3>
      </div>
      <Icon className="size-5 shrink-0 text-neutral-500" aria-hidden="true" />
    </div>
  )
}

export function SkillsBento() {
  return (
    <section id="stack" aria-labelledby="stack-title" className="relative scroll-mt-24 px-4 py-24">
      <SectionVignette tone="lime" anchor="left" />
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          id="stack-title"
          index="02"
          eyebrow="Skills & Architecture"
          title="The stack, from tensors to syscalls."
        />

        <div className="grid auto-rows-[minmax(0,auto)] gap-4 md:grid-cols-2 lg:grid-cols-4">
          <article className="glass relative flex flex-col gap-6 overflow-hidden rounded-2xl p-6 md:col-span-2 lg:row-span-2">
            <div
              className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-lime-500/15 blur-3xl"
              aria-hidden="true"
            />
            <TileHeader icon={Network} label="Tile 01" title="AI & Machine Learning" />
            <p className="text-sm leading-relaxed text-neutral-400">
              Exploring neural networks and data pipelines through undergraduate study and hands-on experiments
              with Python and PyTorch - from data preparation to model training and evaluation.
            </p>
            <div
              className="flex h-40 items-end gap-1.5 rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 lg:h-auto lg:min-h-40 lg:flex-1"
              role="img"
              aria-label="Illustrative training loss curve trending downward"
            >
              {[92, 78, 70, 58, 52, 44, 39, 33, 30, 26, 23, 21, 19, 18, 17, 16].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 self-stretch rounded-sm bg-gradient-to-t from-lime-500/70 to-red-400/60"
                  style={{ clipPath: `inset(${100 - h}% 0 0 0 round 2px)` }}
                />
              ))}
            </div>
            <div className="flex items-center justify-between font-mono text-[11px] text-neutral-500">
              <span>example · epoch 0</span>
              <span className="text-lime-400">loss ↓ 0.0412</span>
              <span>epoch 64</span>
            </div>
            <Chips tone="lime" items={['Python', 'PyTorch', 'Data Modeling', 'Model Training', 'Model Evaluation']} />
          </article>

          <article className="glass flex flex-col gap-5 rounded-2xl p-6 md:col-span-2">
            <TileHeader icon={Cpu} label="Tile 02" title="Systems & Backend" />
            <pre className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/70 p-4 font-mono text-xs leading-relaxed text-neutral-400">
              <code>
                <span className="text-red-400">$</span> go build -gcflags=<span className="text-lime-300">{'"-m"'}</span>{' '}
                ./...{'\n'}
                <span className="text-neutral-500">./node.go:14: </span>
                <span className="text-lime-400">{'&Node{} does not escape'}</span>
                {'\n'}
                <span className="text-neutral-500">./pool.go:31: </span>
                <span className="text-lime-400">0 allocs/op</span>
              </code>
            </pre>
            <Chips
              tone="red"
              items={['Go', 'Pointer Rewiring', 'Escape Analysis', 'Zero-Alloc', 'FastAPI', 'Python', 'SQLite WAL']}
            />
          </article>

          <article className="glass flex flex-col gap-5 rounded-2xl p-6">
            <TileHeader icon={Globe} label="Tile 03" title="Web Ecosystem" />
            <Chips
              tone="neutral"
              items={['Next.js 15', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'WebGL', 'Spline']}
            />
          </article>

          <article className="glass flex flex-col gap-5 rounded-2xl p-6">
            <TileHeader icon={Wrench} label="Tile 04" title="Languages & Tools" />
            <Chips tone="neutral" items={['VS Code', 'Git']} />
            <p className="mt-auto font-mono text-xs text-neutral-500">
              RU <span className="text-lime-400">●●●</span> EN <span className="text-lime-400">●●●</span> JA{' '}
              <span className="text-red-400">●</span>
              <span className="text-neutral-700">●●</span>
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
