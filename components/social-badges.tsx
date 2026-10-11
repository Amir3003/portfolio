import { Music2 } from 'lucide-react'
import { currentVibe } from '@/lib/site'

export function SocialBadges() {
  return (
    <p className="inline-flex items-center gap-2 font-mono text-xs text-muted-foreground">
      <Music2 className="size-4 text-accent" aria-hidden="true" />
      <span>
        Spotify: <span className="text-foreground">{currentVibe}</span>
      </span>
    </p>
  )
}
