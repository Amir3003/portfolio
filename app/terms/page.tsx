import type { Metadata } from 'next'
import { LegalPage, OperatorBlock } from '@/components/legal/legal-page'

export const metadata: Metadata = { title: 'Terms of Service', robots: { index: true, follow: true } }

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <OperatorBlock />

      <section>
        <h2>Using the site</h2>
        <p>
          This is a personal portfolio. By using it you agree to these terms. If you do not agree, please do not use the
          site.
        </p>
      </section>

      <section>
        <h2>Demonstration content</h2>
        <p>
          The Voyage AI demo, its hotel catalog, prices, flights and ratings are illustrative sample data. They are not
          offers, quotes or bookings, and no travel service can be purchased here.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>Do not attempt to disrupt, overload, scan or gain unauthorised access to the site or its API.</li>
          <li>Do not use automated tools to send requests faster than the published rate limits.</li>
          <li>Do not submit unlawful content or other people&apos;s personal data through the demo or forms.</li>
        </ul>
        <p>Access may be limited or blocked to protect the site.</p>
      </section>

      <section>
        <h2>Intellectual property</h2>
        <p>
          The site design, text and original code are owned by the operator unless stated otherwise. Open-source
          components remain under their own licences. Third-party names and marks belong to their owners.
        </p>
      </section>

      <section>
        <h2>Third-party links</h2>
        <p>Links to other sites are provided for convenience. Those sites have their own terms and policies.</p>
      </section>

      <section>
        <h2>No warranty and liability</h2>
        <p>
          The site is provided as is, without warranties of any kind. To the extent permitted by law, the operator is not
          liable for losses arising from use of the site or reliance on its demonstration content.
        </p>
      </section>

      <section>
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of the Republic of Kazakhstan, without limiting mandatory consumer rights where you live.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>These terms may be updated. The date above shows the latest version.</p>
      </section>
    </LegalPage>
  )
}
