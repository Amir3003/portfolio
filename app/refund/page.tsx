import type { Metadata } from 'next'
import { LegalPage, OperatorBlock } from '@/components/legal/legal-page'

export const metadata: Metadata = { title: 'Refund Policy', robots: { index: true, follow: true } }

export default function RefundPage() {
  return (
    <LegalPage title="Refund Policy">
      <OperatorBlock />

      <section>
        <h2>No payments on this site</h2>
        <p>
          This website does not sell products or services and does not accept payments, so there is nothing to refund
          here. The Voyage AI demo shows sample prices only and cannot be used to book or pay for travel.
        </p>
      </section>

      <section>
        <h2>Freelance work</h2>
        <p>
          Paid work arranged through Freelance.kz is governed by that platform&apos;s terms and dispute process. Any work
          agreed outside a platform will have its payment and refund terms confirmed in writing before it starts.
        </p>
      </section>

      <section>
        <h2>Questions</h2>
        <p>Use the contact details above if you believe you were charged in connection with this site.</p>
      </section>
    </LegalPage>
  )
}
