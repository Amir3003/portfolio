'use client'

import { useId, useState, type FormEvent } from 'react'

type Kind = 'access' | 'deletion' | 'correction'
type Status = { state: 'idle' } | { state: 'sending' } | { state: 'done' } | { state: 'error'; message: string }

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/

const KIND_LABELS: Record<Kind, string> = {
  access: 'Send me a copy of my data',
  deletion: 'Delete my data',
  correction: 'Correct my data',
}

export function DataRequestForm() {
  const uid = useId()
  const [email, setEmail] = useState('')
  const [kind, setKind] = useState<Kind>('deletion')
  const [details, setDetails] = useState('')
  const [consent, setConsent] = useState(false)
  const [age, setAge] = useState(false)
  const [website, setWebsite] = useState('')
  const [errors, setErrors] = useState<Partial<Record<'email' | 'consent' | 'age', string>>>({})
  const [status, setStatus] = useState<Status>({ state: 'idle' })

  function validate(): boolean {
    const next: typeof errors = {}
    if (!EMAIL.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!consent) next.consent = 'Please confirm to continue.'
    if (!age) next.age = 'Please confirm to continue.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status.state === 'sending' || !validate()) return
    setStatus({ state: 'sending' })
    try {
      const res = await fetch('/api/data-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), kind, details, consent, ageConfirmed: age, website }),
      })
      if (res.ok) {
        setStatus({ state: 'done' })
        return
      }
      const data: unknown = await res.json().catch(() => null)
      const message =
        typeof data === 'object' && data !== null && 'message' in data && typeof data.message === 'string'
          ? data.message
          : 'Something went wrong. Please try again later.'
      setStatus({ state: 'error', message })
    } catch {
      setStatus({ state: 'error', message: 'Network error. Please try again later.' })
    }
  }

  if (status.state === 'done') {
    return (
      <p role="status" className="border border-neutral-700 p-4 text-sm text-neutral-200">
        Your request was sent. A reply will go to the address you provided.
      </p>
    )
  }

  const field = 'w-full border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 focus-visible:outline-2 focus-visible:outline-lime-400'

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm text-neutral-300">Request type</legend>
        {(Object.keys(KIND_LABELS) as Kind[]).map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm text-neutral-200">
            <input type="radio" name={`${uid}-kind`} checked={kind === k} onChange={() => setKind(k)} />
            {KIND_LABELS[k]}
          </label>
        ))}
      </fieldset>

      <div>
        <label htmlFor={`${uid}-email`} className="mb-1 block text-sm text-neutral-300">
          Email address
        </label>
        <input
          id={`${uid}-email`}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? `${uid}-email-err` : undefined}
          maxLength={254}
          className={field}
        />
        {errors.email ? (
          <p id={`${uid}-email-err`} className="mt-1 text-sm text-red-400">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor={`${uid}-details`} className="mb-1 block text-sm text-neutral-300">
          Details (optional)
        </label>
        <textarea
          id={`${uid}-details`}
          rows={3}
          maxLength={1000}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className={field}
        />
      </div>

      {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="flex items-start gap-2 text-sm text-neutral-200">
            <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>I agree that my email address and request are used only to handle this request.</span>
          </label>
          {errors.consent ? <p className="mt-1 text-sm text-red-400">{errors.consent}</p> : null}
        </div>
        <div>
          <label className="flex items-start gap-2 text-sm text-neutral-200">
            <input type="checkbox" className="mt-1" checked={age} onChange={(e) => setAge(e.target.checked)} />
            <span>I am at least 16 years old, or a parent or guardian is submitting this request for me.</span>
          </label>
          {errors.age ? <p className="mt-1 text-sm text-red-400">{errors.age}</p> : null}
        </div>
      </div>

      <div className="flex flex-col items-start gap-2">
        <button
          type="submit"
          disabled={status.state === 'sending'}
          className="border border-lime-400 px-4 py-2 text-sm text-lime-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime-400 disabled:opacity-50"
        >
          {status.state === 'sending' ? 'Sending' : 'Send request'}
        </button>
        <p role="status" aria-live="polite" className="min-h-5 text-sm text-red-400">
          {status.state === 'error' ? status.message : ''}
        </p>
      </div>
    </form>
  )
}
