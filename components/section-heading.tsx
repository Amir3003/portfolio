export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
  index,
}: {
  id: string
  /** Optional small label above the title. Prefer leaving it out: the heading carries the section. */
  eyebrow?: string
  title: string
  description?: string
  index?: string
}) {
  return (
    <div className="mb-10 flex flex-col gap-3">
      {eyebrow ? (
        <p className="font-mono text-xs text-lime-400">
          {index ? <span className="mr-2 text-neutral-400">{index}</span> : null}
          {eyebrow}
        </p>
      ) : null}
      <h2 id={id} className="text-balance text-3xl font-semibold tracking-tight text-neutral-50 sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="max-w-2xl text-pretty leading-relaxed text-neutral-400">{description}</p> : null}
    </div>
  )
}
