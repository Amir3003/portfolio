'use client'

import { useRef } from 'react'
import { QadamAmbient } from '@/components/qadam/qadam-ambient'
import { ChevronRightIcon } from '@/components/qadam/qadam-icons'
import { qadamLinks } from '@/lib/site'

/*
 * QADAM in the laptop story: a copy of the live site's student landing (qadamhub.com/students),
 * with the same copy, type, colours, cards and ambient background. Everything scrolls inside
 * the panel, so the in-panel link scrolls that pane instead of the page (scrolling the page
 * would move the story on and collapse the panel). Keep the copy in step with the live site.
 */

const SITE = qadamLinks.site

/* Shared look of the live landings: light glass cards, emerald to teal actions. */
const GLASS_CARD =
  'rounded-2xl bg-gradient-to-br from-[#EDF7F6]/95 via-[#F3F6FF]/95 to-[#E8F4F8]/95 backdrop-blur-xl border border-teal-300/40 shadow-[0_20px_50px_-20px_rgba(6,182,212,0.25)] text-slate-900'
const PRIMARY_BUTTON =
  'min-h-[48px] px-7 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-[15px] shadow-lg shadow-emerald-900/30 active:scale-[0.99] transition-all cursor-pointer inline-flex items-center justify-center gap-2.5'
const GHOST_BUTTON =
  'min-h-[48px] px-7 rounded-xl border border-teal-400/40 bg-slate-900/40 hover:bg-slate-800/60 text-teal-100 hover:text-white font-semibold text-[15px] backdrop-blur-md transition-all cursor-pointer inline-flex items-center justify-center gap-2.5'
const EYEBROW = 'text-[12px] font-mono uppercase tracking-[0.16em] text-teal-300'
const CONTAINER = 'max-w-6xl mx-auto px-4 sm:px-6'

const GOALS = ['MEXT Scholarship', 'University admissions abroad', 'Top GPA', 'Hackathons', 'Research internships']

const FEATURES: ReadonlyArray<{ title: string; text: string }> = [
  {
    title: 'Opportunity Radar',
    text: 'Grants, internships and hackathons. Every listing has a deadline confirmed on the organizer page.',
  },
  {
    title: 'CV and Skill Lab',
    text: '235 skill quizzes and a CV gap check against each opportunity, so you know what to learn first.',
  },
  {
    title: 'Application prep',
    text: 'A checklist before you apply on the organizer site, with the gaps in your profile called out.',
  },
  {
    title: 'Alerts in Telegram and Discord',
    text: 'New listings that match your goals, in the messenger you already use.',
  },
  {
    title: 'Teammates and Network',
    text: 'Find people for a hackathon team and message them. Joining is your choice.',
  },
  {
    title: 'Private by default',
    text: 'Your profile stays on your device. You choose whether to join the shared network.',
  },
]

const STEPS: ReadonlyArray<readonly [string, string]> = [
  ['Create a profile', 'Your name, university, skills and goals, for example a MEXT scholarship or a place at a university abroad.'],
  ['Get matched', 'The Radar shows how well each opportunity fits your skills and what is missing.'],
  ['Close the gaps', 'Take a quiz, fix your CV, then prepare the application.'],
]

const FOOTER_LINKS: ReadonlyArray<readonly [string, string]> = [
  ['Privacy', '/privacy'],
  ['Terms', '/terms'],
  ['Refunds', '/refund'],
  ['Data request', '/privacy#data-request'],
]

/** The live site's student/school switch: "For Students" is the page shown here. */
function AudienceSwitch() {
  return (
    <nav
      aria-label="Choose your audience"
      className="relative inline-grid grid-cols-2 rounded-full border border-white/10 bg-[#0B101E]/80 p-0.5"
    >
      <span
        aria-hidden="true"
        className="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-gradient-to-r from-emerald-500/25 to-teal-500/25 border border-teal-400/40"
      />
      <a
        href={`${SITE}/students`}
        target="_blank"
        rel="noopener noreferrer"
        aria-current="page"
        className="relative z-10 min-h-[36px] px-3.5 sm:px-4 inline-flex items-center justify-center whitespace-nowrap rounded-full text-[13px] font-semibold text-white"
      >
        For Students
      </a>
      <a
        href={`${SITE}/welcome`}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 min-h-[36px] px-3.5 sm:px-4 inline-flex items-center justify-center whitespace-nowrap rounded-full text-[13px] font-semibold text-teal-100/70 transition-colors hover:text-white"
      >
        For Schools
      </a>
    </nav>
  )
}

export function QadamShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLElement>(null)

  const showFeatures = () => {
    const pane = scrollRef.current
    const target = featuresRef.current
    if (!pane || !target) return
    const top = target.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop - 16
    pane.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div className="qadam-ui relative isolate flex h-full w-full flex-col overflow-hidden rounded-2xl border border-teal-500/20 bg-[#0B101E] font-sans text-slate-100 antialiased shadow-[0_24px_80px_rgba(0,0,0,0.6)]">
      <QadamAmbient />

      <header className="relative z-10 shrink-0 border-b border-teal-500/20 bg-slate-900/60 shadow-md backdrop-blur-md">
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 md:px-12">
          <a href={`${SITE}/students`} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-3" aria-label="QADAM Hub for students">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/qadam/qadam-icon.png" alt="" width={32} height={32} className="size-8 shrink-0 rounded-md object-contain" />
            <span className="whitespace-nowrap font-mono text-[18px] font-bold tracking-tight text-white">
              QADAM <span className="text-teal-300">Hub</span>
            </span>
          </a>
          <div className="hidden md:block">
            <AudienceSwitch />
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`${SITE}/student`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden h-10 items-center rounded-lg border border-teal-500/30 px-4 text-[13px] font-semibold text-teal-100 transition-colors hover:bg-teal-500/10 hover:text-white sm:inline-flex"
            >
              I have an invite code
            </a>
            <a
              href={`${SITE}/start`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 px-4 text-[13px] font-semibold text-white shadow-md shadow-emerald-900/30 transition-all hover:from-emerald-400 hover:to-teal-500 sm:px-5"
            >
              Start free
              <ChevronRightIcon size={13} className="hidden sm:block" />
            </a>
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        data-lenis-prevent="true"
        className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        <section className="relative mx-auto flex min-h-full max-w-5xl flex-col items-center justify-center px-4 pt-12 pb-20 text-center sm:px-6">
          <div className="flex flex-col items-center space-y-6 sm:space-y-8">
            <div className="md:hidden">
              <AudienceSwitch />
            </div>
            <div className="qadam-rise inline-flex items-center gap-2.5 rounded-full border border-teal-400/30 bg-teal-500/10 px-4 py-1.5 font-mono text-[13px] tracking-wide text-teal-200 backdrop-blur-md">
              <span className="size-2 rounded-full bg-emerald-400" />
              <span>QADAM Hub · For students · Free during the beta</span>
            </div>
            <h2 className="qadam-rise max-w-4xl text-balance text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] text-white [animation-delay:60ms] sm:text-6xl lg:text-[72px]">
              Find grants, hackathons and scholarships that fit you
            </h2>
            <p className="qadam-rise mx-auto max-w-2xl text-lg leading-relaxed text-teal-100/85 [animation-delay:120ms] sm:text-xl">
              Set a goal, check your skills with quizzes and see which real opportunities you can apply to now. No school or
              invite needed.
            </p>
            <div className="qadam-rise flex w-full flex-col justify-center gap-3 pt-2 [animation-delay:180ms] sm:w-auto sm:flex-row">
              <a href={`${SITE}/start`} target="_blank" rel="noopener noreferrer" className={PRIMARY_BUTTON}>
                Start free
                <ChevronRightIcon size={18} />
              </a>
              <button type="button" onClick={showFeatures} className={GHOST_BUTTON}>
                See what you get
              </button>
            </div>
            <div className="qadam-rise flex flex-wrap justify-center gap-2 pt-2 [animation-delay:240ms]">
              {GOALS.map((goal) => (
                <span
                  key={goal}
                  className="rounded-full border border-teal-500/25 bg-slate-900/50 px-3 py-1.5 font-mono text-[12px] text-teal-200 backdrop-blur-md"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-24 pb-24 sm:space-y-32">
          <section ref={featuresRef} className={CONTAINER}>
            <p className={EYEBROW}>What you get</p>
            <h3 className="mt-3 max-w-3xl text-[32px] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[44px]">
              One place for the whole application path
            </h3>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className={`${GLASS_CARD} flex flex-col gap-3 p-5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 sm:p-6`}
                >
                  <span className="self-start rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 font-mono text-[12px] font-semibold text-emerald-800">
                    Available now
                  </span>
                  <h4 className="text-[17px] font-bold text-indigo-950">{feature.title}</h4>
                  <p className="text-[14px] leading-relaxed text-slate-700">{feature.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={CONTAINER}>
            <p className={EYEBROW}>How it works</p>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {STEPS.map(([title, text], index) => (
                <li key={title} className="rounded-2xl border border-teal-500/25 bg-slate-900/60 p-5 backdrop-blur-md sm:p-6">
                  <span className="font-mono text-[12px] text-teal-300">0{index + 1}</span>
                  <h4 className="mt-2 text-[18px] font-semibold text-white">{title}</h4>
                  <p className="mt-2 text-[14px] leading-relaxed text-teal-100/85">{text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 max-w-2xl font-mono text-[13px] leading-relaxed text-teal-200/80">
              Your profile is stored on your device. Nothing is shared with other people unless you choose to join the network.
            </p>
          </section>

          <section className={CONTAINER}>
            <div className="rounded-3xl border border-teal-500/25 bg-slate-900/60 px-6 py-12 text-center backdrop-blur-md sm:px-12 sm:py-16">
              <h3 className="text-[32px] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[48px]">
                Start with one goal
              </h3>
              <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-teal-100/85">
                Free while we are in beta. Tell us what is not working with the Feedback button inside the app.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={`${SITE}/start`} target="_blank" rel="noopener noreferrer" className={PRIMARY_BUTTON}>
                  Start free
                  <ChevronRightIcon size={18} />
                </a>
                <a href={`${SITE}/welcome`} target="_blank" rel="noopener noreferrer" className={GHOST_BUTTON}>
                  For schools and training centers
                </a>
              </div>
            </div>
          </section>
        </div>

        <footer className="border-t border-teal-500/20 bg-slate-950/60 px-6 pt-8 pb-10 backdrop-blur-md md:px-12">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 font-mono text-[12px] leading-4 text-teal-200/80 md:flex-row">
            <div className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/qadam/qadam-icon.png" alt="" width={20} height={20} className="size-5 object-contain" />
              <span className="font-bold text-white">QADAM Hub</span>
              <span>© 2026</span>
            </div>
            <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-1">
              {FOOTER_LINKS.map(([label, path]) => (
                <a
                  key={label}
                  href={`${SITE}${path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </footer>
      </div>
    </div>
  )
}
