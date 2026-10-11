'use client'

import { focusTerminal } from '@/lib/site'

export function TerminalCta({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={focusTerminal} className={className}>
      {children}
    </button>
  )
}
