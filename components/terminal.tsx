'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { socials } from '@/lib/site'

type Entry = { id: number; command: string; output: ReactNode }

const QUICK_COMMANDS = ['help', 'cat bio.txt', 'run benchmarks', 'socials', 'clear'] as const

function Prompt() {
  return (
    <span className="shrink-0 select-none">
      <span className="text-lime-400">amir@astana-node</span>
      <span className="text-neutral-500">:</span>
      <span className="text-red-400">~</span>
      <span className="text-neutral-500">$</span>
    </span>
  )
}

function HelpOutput() {
  const rows: [string, string][] = [
    ['help', 'list available commands'],
    ['cat bio.txt', 'print a short biography'],
    ['run benchmarks', 'execute the Voyage AI perf suite'],
    ['socials', 'open contact channels'],
    ['clear', 'wipe the screen'],
  ]
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
      {rows.map(([cmd, desc]) => (
        <div key={cmd} className="contents">
          <dt className="text-red-300">{cmd}</dt>
          <dd className="text-neutral-500">{desc}</dd>
        </div>
      ))}
    </dl>
  )
}

function BioOutput() {
  return (
    <div className="flex flex-col gap-1 text-neutral-300">
      <p>
        <span className="text-neutral-500">name:</span> Amir Nagiyev
      </p>
      <p>
        <span className="text-neutral-500">age:</span> 17
      </p>
      <p>
        <span className="text-neutral-500">location:</span> Astana, Kazakhstan
      </p>
      <p>
        <span className="text-neutral-500">role:</span> AI & ML undergraduate · systems tinkerer
      </p>
      <p>
        <span className="text-neutral-500">languages:</span> RU (fluent) · EN (fluent) · JA (→ JLPT N3/N2)
      </p>
      <p className="mt-2 text-neutral-400">
        {'> I train models by day and read Go escape-analysis output by night.'}
      </p>
    </div>
  )
}

function BenchmarksOutput() {
  const rows = [
    { name: 'GET /v1/recommend', p99: 44, max: 60 },
    { name: 'GET /v1/places/:id', p99: 18, max: 60 },
    { name: 'POST /v1/preferences', p99: 27, max: 60 },
  ]
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-neutral-500">running 3 suites · 10,000 req · concurrency=64</p>
      {rows.map((r) => {
        const filled = Math.round((r.p99 / r.max) * 20)
        return (
          <p key={r.name} className="flex flex-wrap gap-x-3 text-neutral-300">
            <span className="w-44 shrink-0">{r.name}</span>
            <span aria-hidden="true">
              <span className="text-lime-400">{'█'.repeat(filled)}</span>
              <span className="text-neutral-700">{'░'.repeat(20 - filled)}</span>
            </span>
            <span className="text-red-300">p99 {r.p99}ms</span>
          </p>
        )
      })}
      <p className="text-lime-400">[ok] all suites passed · p99 {'<'} 45ms · 0 errors</p>
    </div>
  )
}

function SocialsOutput() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-neutral-500">select a channel:</p>
      <ul className="flex flex-col gap-1.5">
        {socials.map((s) => (
          <li key={s.label}>
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex max-w-full items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-neutral-200 transition-colors hover:border-lime-500/60 hover:text-lime-300 focus-visible:outline-2 focus-visible:outline-lime-400"
            >
              <span className="w-28 shrink-0 text-lime-400">[{s.label}]</span>
              <span className="truncate text-neutral-500 underline-offset-4 group-hover:text-neutral-200 group-hover:underline">
                {s.href.replace(/^https?:\/\/(www\.)?/, '')}
              </span>
              <ArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function resolve(command: string): ReactNode {
  switch (command) {
    case 'help':
      return <HelpOutput />
    case 'cat bio.txt':
      return <BioOutput />
    case 'run benchmarks':
      return <BenchmarksOutput />
    case 'socials':
      return <SocialsOutput />
    case '':
      return null
    default:
      return (
        <p className="text-red-400">
          command not found: {command}. type <span className="text-red-300">help</span> for options.
        </p>
      )
  }
}

const welcome: Entry = {
  id: 0,
  command: '',
  output: (
    <div className="text-neutral-400">
      <p className="text-neutral-200">astana-node v1.0 — connection established.</p>
      <p>
        Type <span className="text-red-300">help</span> or click a command below to begin.
      </p>
    </div>
  ),
}

export function Terminal() {
  const [entries, setEntries] = useState<Entry[]>([welcome])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number | null>(null)
  const nextId = useRef(1)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  function run(raw: string) {
    const command = raw.trim().replace(/\s+/g, ' ').toLowerCase()
    if (command) setHistory((h) => [...h, command])
    setHistoryIndex(null)
    setInput('')
    if (command === 'clear') {
      setEntries([])
      return
    }
    setEntries((prev) => [...prev, { id: nextId.current++, command, output: resolve(command) }])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (e.nativeEvent.isComposing || e.keyCode === 229) return
      e.preventDefault()
      run(input)
    } else if (e.key === 'ArrowUp') {
      if (!history.length) return
      e.preventDefault()
      const idx = historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1)
      setHistoryIndex(idx)
      setInput(history[idx])
    } else if (e.key === 'ArrowDown') {
      if (historyIndex === null) return
      e.preventDefault()
      const idx = historyIndex + 1
      if (idx >= history.length) {
        setHistoryIndex(null)
        setInput('')
      } else {
        setHistoryIndex(idx)
        setInput(history[idx])
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setEntries([])
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/90 shadow-[0_0_80px_-20px] shadow-lime-500/30 backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-neutral-800 bg-neutral-900/70 px-4 py-3">
        <div className="flex gap-2" aria-hidden="true">
          <span className="size-3 rounded-full bg-red-500/90" />
          <span className="size-3 rounded-full bg-yellow-500/90" />
          <span className="size-3 rounded-full bg-green-500/90" />
        </div>
        <p className="flex-1 text-center font-mono text-xs text-neutral-400">amir@astana-node:~</p>
        <span className="w-[52px]" aria-hidden="true" />
      </div>

      <div
        ref={scrollRef}
        onClick={() => inputRef.current?.focus({ preventScroll: true })}
        className="h-[22rem] cursor-text overflow-y-auto p-4 font-mono text-[13px] leading-relaxed sm:h-[26rem]"
      >
        <div role="log" aria-live="polite" aria-label="Terminal output" className="flex flex-col gap-4">
          {entries.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1.5">
              {entry.id !== 0 ? (
                <p className="flex gap-2 break-all text-neutral-100">
                  <Prompt />
                  <span>{entry.command}</span>
                </p>
              ) : null}
              {entry.output}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Prompt />
          <label htmlFor="terminal-input" className="sr-only">
            Terminal command
          </label>
          <input
            ref={inputRef}
            id="terminal-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="send"
            className="min-w-0 flex-1 bg-transparent text-neutral-100 caret-lime-400 outline-none placeholder:text-neutral-700"
            placeholder="type a command…"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-neutral-800 bg-neutral-900/50 p-3" aria-label="Quick commands">
        {QUICK_COMMANDS.map((cmd) => (
          <button
            key={cmd}
            type="button"
            onClick={() => {
              run(cmd)
              inputRef.current?.focus({ preventScroll: true })
            }}
            className="rounded-md border border-neutral-800 bg-neutral-950 px-2.5 py-1 font-mono text-xs text-neutral-400 transition-colors hover:border-red-400/50 hover:text-red-300 focus-visible:outline-2 focus-visible:outline-red-400"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  )
}
