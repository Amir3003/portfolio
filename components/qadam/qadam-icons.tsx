import type { FC } from 'react'

/* Icons copied from the QADAM web app (src/components/Icons.tsx) so the showcase matches it. */

export interface IconProps {
  className?: string
  size?: number
}

export const ChevronRightIcon: FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

export const TelegramIcon: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Telegram">
    <circle cx="12" cy="12" r="12" fill="#229ED9" />
    <path
      d="M17.4 7.6c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"
      fill="#FFFFFF"
    />
  </svg>
)

export const DiscordIcon: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Discord">
    <circle cx="12" cy="12" r="12" fill="#5865F2" />
    <path
      d="M17.2 7.33a11.8 11.8 0 00-2.9-1c-.13.24-.28.55-.38.79-1.24-.19-2.48-.19-3.7 0-.11-.24-.26-.55-.39-.79a11.9 11.9 0 00-2.9 1c-1.85 2.76-2.35 5.45-2.1 8.1 1.22.9 2.4 1.45 3.56 1.8.28-.38.53-.78.75-1.2-.4-.15-.77-.33-1.12-.54.1-.07.19-.14.28-.22 2.34 1.07 4.86 1.07 7.18 0 .09.08.18.15.28.22-.35.21-.72.39-1.12.54.22.42.47.82.75 1.2 1.16-.35 2.34-.9 3.56-1.8.3-3.08-.5-5.75-2.1-8.1zM9.5 13.5c-.7 0-1.28-.65-1.28-1.44s.57-1.44 1.28-1.44c.72 0 1.3.65 1.28 1.44 0 .79-.56 1.44-1.28 1.44zm5 0c-.7 0-1.28-.65-1.28-1.44s.57-1.44 1.28-1.44c.72 0 1.3.65 1.28 1.44 0 .79-.56 1.44-1.28 1.44z"
      fill="#FFFFFF"
    />
  </svg>
)

export const KakaoTalkIcon: FC<IconProps> = ({ className = '', size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="KakaoTalk">
    <rect width="24" height="24" rx="6" fill="#FEE500" />
    <path
      d="M12 5.5c-4.14 0-7.5 2.6-7.5 5.8 0 2.05 1.37 3.86 3.45 4.89l-.88 3.23c-.08.29.23.52.48.37l3.86-2.55c.2.02.39.03.59.03 4.14 0 7.5-2.6 7.5-5.8S16.14 5.5 12 5.5z"
      fill="#3C1E1E"
    />
  </svg>
)

export const PyTorchIcon: FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="PyTorch">
    <path d="M12.5 3a7.5 7.5 0 00-6.8 10.7l-2.2 2.2a1 1 0 001.4 1.4l2.1-2.1A7.5 7.5 0 1012.5 3zm0 13a5.5 5.5 0 115.5-5.5 5.5 5.5 0 01-5.5 5.5z" fill="#EE4C2C" />
    <circle cx="16" cy="6" r="1.5" fill="#EE4C2C" />
  </svg>
)

export const DockerIcon: FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-label="Docker">
    <path d="M3 13.5c0-1 .8-1.5 2-1.5h14c1.2 0 2 .5 2 1.5s-.8 4.5-4 5.5c-3 .9-8 .9-11 0-2.4-.7-3-4.5-3-5.5z" fill="#2496ED" />
    <rect x="7" y="9" width="2" height="2" rx="0.5" fill="#2496ED" />
    <rect x="10" y="9" width="2" height="2" rx="0.5" fill="#2496ED" />
    <rect x="13" y="9" width="2" height="2" rx="0.5" fill="#2496ED" />
    <rect x="10" y="6" width="2" height="2" rx="0.5" fill="#2496ED" />
    <rect x="13" y="6" width="2" height="2" rx="0.5" fill="#2496ED" />
  </svg>
)

export const LlmIcon: FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-label="LLMs">
    <path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V12h-4V9.5C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z" />
    <path d="M6 15a3 3 0 0 1-2-2.8c0-1.8 1.4-3.2 3.2-3.2h1.8v3a3 3 0 0 1-3 3z" />
    <path d="M18 15a3 3 0 0 0 2-2.8c0-1.8-1.4-3.2-3.2-3.2h-1.8v3a3 3 0 0 0 3 3z" />
    <path d="M8 15v3a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3v-3" />
    <circle cx="12" cy="12" r="1.5" fill="currentColor" />
  </svg>
)

export const LinuxIcon: FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-label="Linux">
    <path d="M12 3a4 4 0 00-4 4v5a4 4 0 008 0V7a4 4 0 00-4-4z" />
    <circle cx="10" cy="6" r="1" fill="currentColor" />
    <circle cx="14" cy="6" r="1" fill="currentColor" />
    <path d="M12 8l-1 2h2l-1-2z" fill="#FCC624" />
    <path d="M6 13c-1.5 2-1 5 1 6l2-1" />
    <path d="M18 13c1.5 2 1 5-1 6l-2-1" />
    <path d="M8 20c1 1 3 1.5 4 1.5s3-.5 4-1.5" />
  </svg>
)

export const InstagramIcon: FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
)

export const TikTokIcon: FC<IconProps> = ({ className = '', size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M16.6 3c.3 2.2 1.6 3.6 3.9 3.8v3.1c-1.4.1-2.7-.3-3.9-1.1v6.2c0 3.9-3.2 6.5-6.7 5.9-2.5-.4-4.4-2.5-4.5-5.1-.2-3.5 2.9-6.3 6.4-5.8v3.2c-1.6-.4-3.2.7-3.2 2.4 0 1.4 1.1 2.4 2.4 2.4 1.4 0 2.4-1.1 2.4-2.6V3h3.2z" />
  </svg>
)
