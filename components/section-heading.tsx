export function SectionHeading({
  id,
  eyebrow,
  title,
  description,
}: {
  id: string
  eyebrow: string
  title: string
  description?: string
}) {
  return (
    <div className="mb-10 flex flex-col gap-3">
      <p className="font-mono text-xs text-lime-400">{eyebrow}</p>
      <h2 id={id} className="text-balance text-3xl font-semibold tracking-tight text-neutral-50 sm:text-4xl">
        {title}
      </h2>
      {description ? <p className="max-w-2xl text-pretty leading-relaxed text-neutral-400">{description}</p> : null}
    </div>
  )
}
