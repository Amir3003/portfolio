import { cn } from '@/lib/utils'

const tones = {
  lime: '[--vignette-tone:color-mix(in_oklch,var(--color-lime-500)_9%,transparent)]',
  red: '[--vignette-tone:color-mix(in_oklch,var(--color-red-500)_8%,transparent)]',
} as const

const anchors = {
  left: '[--vignette-x:18%]',
  center: '[--vignette-x:50%]',
  right: '[--vignette-x:82%]',
} as const

/**
 * Decorative atmospheric wash for a section. It extends beyond the section bounds and fades to
 * transparent at the top and bottom so neighbouring sections blend with no hard rectangular edge.
 * Place inside a `relative` section.
 */
export function SectionVignette({
  tone = 'lime',
  anchor = 'center',
  className,
}: {
  tone?: keyof typeof tones
  anchor?: keyof typeof anchors
  className?: string
}) {
  return <div aria-hidden="true" className={cn('section-vignette', tones[tone], anchors[anchor], className)} />
}

