import { BrainCircuit, Languages, MemoryStick } from 'lucide-react'
import { SectionHeading } from '@/components/section-heading'

const cards = [
  {
    icon: BrainCircuit,
    title: 'Academic focus',
    accent: 'text-lime-400',
    body: 'Undergraduate in Artificial Intelligence & Machine Learning. Studying how models learn: optimization, representation and the architectures behind modern neural networks.',
    tags: ['Deep Learning', 'Optimization', 'Linear Algebra'],
  },
  {
    icon: Languages,
    title: 'Linguistic profile',
    accent: 'text-red-400',
    body: 'Fluent in Russian and English. Actively learning Japanese with Genki → Renshuu stack, targeting JLPT N3 then N2.',
    tags: ['RU · Fluent', 'EN · Fluent', 'JA · Learning'],
  },
  {
    icon: MemoryStick,
    title: 'Systems mindset',
    accent: 'text-lime-400',
    body: 'Obsessed with what happens beneath the abstraction: Go memory mechanics, stack vs. heap allocation, struct field alignment and padding - and how the same rigor applies to network design.',
    tags: ['Stack vs Heap', 'Struct Alignment', 'Escape Analysis'],
  },
]

export function About() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-24 px-4 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          id="about-title"
          index="01"
          eyebrow="About"
          title="Learning machines, understanding metal."
          description="I approach AI the way a systems engineer approaches a runtime: measure, profile, and understand every layer before trusting it."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="glass group flex flex-col gap-4 rounded-2xl p-6 transition-colors hover:border-neutral-700"
            >
              <div className="flex size-10 items-center justify-center rounded-xl border border-neutral-800 bg-neutral-950">
                <card.icon className={`size-5 ${card.accent}`} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-medium text-neutral-100">{card.title}</h3>
              <p className="text-sm leading-relaxed text-neutral-400">{card.body}</p>
              <ul className="mt-auto flex flex-wrap gap-2 pt-2" aria-label={`${card.title} tags`}>
                {card.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-md border border-neutral-800 bg-neutral-950/60 px-2 py-1 font-mono text-[11px] text-neutral-400"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
