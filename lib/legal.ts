/**
 * Operator identity for the legal pages. Values come from environment variables so nothing
 * personal or fictional is hard-coded. Anything left unset is simply not shown.
 */
export interface LegalProfile {
  readonly operator: string
  readonly address: string | null
  readonly registrationId: string | null
  readonly contactEmail: string | null
  readonly contactTelegram: string
  readonly siteUrl: string | null
  readonly lastUpdated: string
}

const clean = (value: string | undefined): string | null => {
  const v = value?.trim()
  return v ? v : null
}

export const legal: LegalProfile = {
  operator: clean(process.env.NEXT_PUBLIC_LEGAL_NAME) ?? 'Amir Nagiyev',
  address: clean(process.env.NEXT_PUBLIC_LEGAL_ADDRESS) ?? 'Astana, Republic of Kazakhstan',
  registrationId: clean(process.env.NEXT_PUBLIC_LEGAL_REGISTRATION_ID),
  contactEmail: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  contactTelegram: 'https://t.me/sfulti',
  siteUrl: clean(process.env.NEXT_PUBLIC_SITE_URL),
  lastUpdated: '2026-10-12',
}
