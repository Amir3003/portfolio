export type Social = {
  label: string
  handle: string
  href: string
}

export interface ContactGroup {
  title: string
  items: readonly Social[]
}

export const PERSONAL_EMAIL = 'a.nagiyev.dev@gmail.com'
/** Set these to show them on the site; empty values are skipped. */
export const WORK_EMAIL: string = ''
export const VK_URL: string = ''

const vk: Social[] = VK_URL ? [{ label: 'VK', handle: VK_URL.replace(/^https?:\/\/(www\.)?/, ''), href: VK_URL }] : []
const workEmail: Social[] = WORK_EMAIL ? [{ label: 'Work email', handle: WORK_EMAIL, href: `mailto:${WORK_EMAIL}` }] : []

export const contactGroups: readonly ContactGroup[] = [
  {
    title: 'Personal',
    items: [
      { label: 'Email', handle: PERSONAL_EMAIL, href: `mailto:${PERSONAL_EMAIL}` },
      { label: 'Telegram', handle: '@amirnagiyevdev', href: 'https://t.me/amirnagiyevdev' },
      { label: 'Instagram', handle: '@ijustwannaw1n', href: 'https://instagram.com/ijustwannaw1n' },
      ...vk,
      { label: 'GitHub', handle: 'Amir3003', href: 'https://github.com/Amir3003' },
      { label: 'LinkedIn', handle: 'in/amir-nagiyev/', href: 'https://www.linkedin.com/in/amir-nagiyev-a23192435/' },
    ],
  },
  {
    title: 'Work · QADAM',
    items: [
      ...workEmail,
      { label: 'Instagram', handle: '@joinqadamhub', href: 'https://instagram.com/joinqadamhub' },
      { label: 'TikTok', handle: '@qadamhub', href: 'https://www.tiktok.com/@qadamhub' },
      { label: 'Freelance.kz', handle: 'freelance.kz', href: 'https://freelance.kz/profile/3oad0w6' },
      { label: 'Freelancer', handle: 'AmirNagiev', href: 'https://www.freelancer.com/u/AmirNagiev' },
    ],
  },
]

/** Every profile link, for structured data. */
export const socials: readonly Social[] = contactGroups.flatMap((g) => g.items).filter((s) => s.href.startsWith('http'))

export const voyageLinks = {
  repo: 'https://github.com/Amir3003/AItouragent',
} as const

export const qadamLinks = {
  site: 'https://www.qadamhub.com',
  instagram: 'https://instagram.com/joinqadamhub',
  tiktok: 'https://www.tiktok.com/@qadamhub',
} as const

export const navItems = [
  { label: 'Profile', href: '#about' },
  { label: 'Architecture', href: '#architecture' },
  { label: 'Voyage AI', href: '#voyage' },
  { label: 'QADAM', href: '#qadam' },
  { label: 'Contact', href: '#contact' },
] as const
