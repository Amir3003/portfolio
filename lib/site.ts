import { BriefcaseBusiness, Camera, Code2, Laptop, Send, type LucideIcon } from 'lucide-react'
import { getLenis } from '@/lib/lenis'

export type Social = {
  label: string
  handle: string
  href: string
  icon: LucideIcon
}

export const socials: Social[] = [
  { label: 'Telegram', handle: '@sfulti', href: 'https://t.me/sfulti', icon: Send },
  { label: 'GitHub', handle: 'Amir3003', href: 'https://github.com/Amir3003', icon: Code2 },
  {
    label: 'LinkedIn',
    handle: 'in/amir-nagiev/',
    href: 'https://www.linkedin.com/in/amir-nagiyev-a23192435/',
    icon: BriefcaseBusiness,
  },
  { label: 'Instagram', handle: '@ijustwannaw1n', href: 'https://instagram.com/ijustwannaw1n', icon: Camera },
  {
    label: 'Freelance.kz',
    handle: 'freelance.kz',
    href: 'https://freelance.kz/profile/3oad0w6',
    icon: Laptop,
  },
]

export const currentVibe = 'IJWW'

export const zariLinks = {
  repo: 'https://github.com/Amir3003/AItouragent',
  demo: '#',
} as const

export const navItems = [
  { label: 'About', href: '#about' },
  { label: 'Stack', href: '#stack' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
] as const

export function focusTerminal() {
  const contact = document.getElementById('contact')
  const lenis = getLenis()
  if (contact) {
    if (lenis) lenis.scrollTo(contact, { offset: 0 })
    else contact.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const input = document.getElementById('terminal-input') as HTMLInputElement | null
  input?.focus({ preventScroll: true })
}