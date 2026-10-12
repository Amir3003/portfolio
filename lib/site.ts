export type Social = {
  label: string
  handle: string
  href: string
}

export const socials: readonly Social[] = [
  { label: 'Telegram', handle: '@sfulti', href: 'https://t.me/sfulti' },
  { label: 'GitHub', handle: 'Amir3003', href: 'https://github.com/Amir3003' },
  {
    label: 'LinkedIn',
    handle: 'in/amir-nagiyev/',
    href: 'https://www.linkedin.com/in/amir-nagiyev-a23192435/',
  },
  { label: 'Instagram', handle: '@ijustwannaw1n', href: 'https://instagram.com/ijustwannaw1n' },
  { label: 'Freelance.kz', handle: 'freelance.kz', href: 'https://freelance.kz/profile/3oad0w6' },
  { label: 'Freelancer', handle: 'AmirNagiev', href: 'https://www.freelancer.com/u/AmirNagiev' },
]

export const voyageLinks = {
  repo: 'https://github.com/Amir3003/AItouragent',
} as const

export const navItems = [
  { label: 'Profile', href: '#about' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Voyage AI', href: '#voyage' },
  { label: 'Contact', href: '#contact' },
] as const

export function focusTerminal(): void {
  // Terminal feature removed
}
