import type { Metadata } from 'next'
import { DataRequestForm } from '@/components/legal/data-request-form'
import { LegalPage, OperatorBlock } from '@/components/legal/legal-page'

export const metadata: Metadata = { title: 'Privacy Policy', robots: { index: true, follow: true } }

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <OperatorBlock />

      <section>
        <h2>What this site collects</h2>
        <ul>
          <li>
            <strong>Hosting logs.</strong> Like any website, the hosting provider receives your IP address, browser
            type and the pages you request, to deliver the site and protect it from abuse.
          </li>
          <li>
            <strong>Analytics, only if you accept.</strong> If you choose Accept in the banner, Vercel Web Analytics
            counts page views. It does not use advertising cookies. If you decline, it is never loaded.
          </li>
          <li>
            <strong>Voyage AI demo.</strong> Text you type into the demo is sent to this site&apos;s server to produce a
            reply. The operator does not store it in a database and does not use it for advertising or training.
          </li>
          <li>
            <strong>Terminal.</strong> The terminal runs entirely in your browser. Commands are not sent anywhere.
          </li>
          <li>
            <strong>Your choice.</strong> The consent choice is saved in your browser&apos;s local storage so the banner
            does not reappear. It is not a cookie and is never sent to the server.
          </li>
        </ul>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          The site itself sets no cookies. You can change or withdraw your analytics choice at any time with
          &quot;Cookie settings&quot; in the footer.
        </p>
      </section>

      <section>
        <h2>Why and on what basis</h2>
        <p>
          Hosting logs are processed to operate and secure the site. Analytics is processed only on your consent, which
          you can withdraw at any time. Data requests are processed to fulfil your request.
        </p>
      </section>

      <section>
        <h2>Sharing and transfers</h2>
        <p>
          Data is processed by the hosting provider and, if you consent, the analytics provider. These providers may
          process data outside Kazakhstan and the European Economic Area. Nothing is sold.
        </p>
      </section>

      <section>
        <h2>Retention</h2>
        <p>
          Hosting and analytics retention is set by those providers. Data request emails are kept only as long as needed
          to answer the request and prove it was handled.
        </p>
      </section>

      <section>
        <h2>Your rights</h2>
        <p>
          You may ask for access to, correction of, or deletion of your personal data, withdraw consent, and object to
          processing, under the personal data laws that apply to you, including the laws of the Republic of Kazakhstan
          and, where relevant, the GDPR. You may also complain to your local data protection authority.
        </p>
      </section>

      <section id="data-request" className="scroll-mt-24">
        <h2>Data request</h2>
        <p className="mb-5">Use this form to ask for access, correction or deletion of your data.</p>
        <DataRequestForm />
      </section>

      <section>
        <h2>Children</h2>
        <p>
          The site is not directed at children under 16 and does not knowingly collect their data. Requests from people
          under 16 must come from a parent or guardian.
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>Material changes will be published on this page with a new date.</p>
      </section>
    </LegalPage>
  )
}
