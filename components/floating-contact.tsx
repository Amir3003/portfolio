'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { socials } from '@/lib/site'

export function FloatingContact() {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onClick = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [open])

  return (
    <div ref={rootRef} className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {open ? (
        <ul
          id={menuId}
          className="flex flex-col gap-1 rounded-2xl border border-neutral-800 bg-neutral-950/90 p-2 shadow-[0_0_40px_-10px] shadow-red-500/40 backdrop-blur-xl"
        >
          {socials.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-neutral-200 transition-colors hover:bg-lime-400/10 hover:text-lime-200 focus-visible:outline-2 focus-visible:outline-lime-400"
              >
                <s.icon className="size-4 text-lime-400" aria-hidden="true" />
                <span className="flex-1">{s.label}</span>
                <span className="font-mono text-xs text-neutral-500">{s.handle}</span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-lime-400/40 bg-neutral-950/80 py-2.5 pl-3 pr-4 text-sm font-medium text-lime-200 shadow-[0_0_28px_-6px] shadow-lime-400/50 backdrop-blur-xl transition-colors hover:border-red-500/60 hover:text-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400"
      >
        {open ? (
          <X className="size-4" aria-hidden="true" />
        ) : (
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-500 opacity-70" />
            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
        )}
        {open ? 'Close' : 'Quick contact'}
        {open ? null : <MessageSquare className="size-4" aria-hidden="true" />}
      </button>
    </div>
  )
}
