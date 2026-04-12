import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'OneWord privacy policy — how we collect, use, and protect your data.',
}

export default function PrivacyPolicy() {
  const lastUpdated = 'April 12, 2026'

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-zinc-300">
      <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm mb-8 inline-block">
        ← Back to OneWord
      </Link>

      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-sm text-zinc-500 mb-8">Last updated: {lastUpdated}</p>

      <div className="space-y-8 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. What We Collect</h2>
          <p className="mb-3">When you use OneWord, we may collect:</p>
          <ul className="list-disc list-inside space-y-2 text-zinc-400">
            <li><strong className="text-zinc-300">Account information:</strong> Email address and display name when you create an account.</li>
            <li><strong className="text-zinc-300">Content:</strong> The words you post in response to daily prompts.</li>
            <li><strong className="text-zinc-300">IP address:</strong> Your IP address is temporarily stored when you post a word or interact with the Service. It is used to derive your approximate city-level location and for abuse prevention (spam detection, ban enforcement). IP addresses are <strong className="text-zinc-200">automatically deleted after 30 days</strong>.</li>
            <li><strong className="text-zinc-300">Approximate location:</strong> We derive your approximate city-level location from your IP address when you post a word. We store only the city name and approximate coordinates (latitude/longitude rounded to ~10 km precision).</li>
            <li><strong className="text-zinc-300">Usage data:</strong> Basic analytics such as page views and interaction patterns.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. Why We Collect It</h2>
          <ul className="list-disc list-inside space-y-2 text-zinc-400">
            <li><strong className="text-zinc-300">Account info:</strong> To let you sign in, maintain streaks, and personalize your experience.</li>
            <li><strong className="text-zinc-300">Content:</strong> To display your words in the feed and archive.</li>
            <li><strong className="text-zinc-300">IP address:</strong> To prevent abuse, detect spam, enforce bans, and derive approximate location. Automatically purged after 30 days.</li>
            <li><strong className="text-zinc-300">Location:</strong> To display an anonymous, aggregate word map showing where words are coming from around the world. Individual posts are <em>not</em> linked to precise locations publicly.</li>
            <li><strong className="text-zinc-300">Usage data:</strong> To improve the app and understand how people use it.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. What We Don&apos;t Do</h2>
          <ul className="list-disc list-inside space-y-2 text-zinc-400">
            <li>We do <strong className="text-zinc-200">not</strong> sell your data to anyone.</li>
            <li>We do <strong className="text-zinc-200">not</strong> retain your IP address beyond 30 days.</li>
            <li>We do <strong className="text-zinc-200">not</strong> share your data with third-party advertisers.</li>
            <li>We do <strong className="text-zinc-200">not</strong> track you across other websites.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage & Security</h2>
          <p className="text-zinc-400">
            Your data is stored in a secure database hosted by{' '}
            <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
              Supabase
            </a>
            . We use industry-standard encryption for data in transit (HTTPS) and follow best practices for data security.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Cookies</h2>
          <p className="text-zinc-400">
            We use essential cookies for authentication (keeping you signed in). We do not use tracking cookies or third-party advertising cookies.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Your Rights</h2>
          <p className="mb-3 text-zinc-400">You can:</p>
          <ul className="list-disc list-inside space-y-2 text-zinc-400">
            <li><strong className="text-zinc-300">Delete your account</strong> and all associated data at any time.</li>
            <li><strong className="text-zinc-300">Request a copy</strong> of your data by contacting us.</li>
            <li><strong className="text-zinc-300">Post anonymously</strong> — anonymous posts are not linked to any account or stored location data.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Third-Party Services</h2>
          <p className="text-zinc-400">We use the following third-party services:</p>
          <ul className="list-disc list-inside space-y-2 text-zinc-400 mt-2">
            <li><strong className="text-zinc-300">Supabase:</strong> Database and authentication.</li>
            <li><strong className="text-zinc-300">MaxMind GeoLite2:</strong> IP-to-location lookup (processed server-side; your IP is not sent to MaxMind).</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Data Retention</h2>
          <ul className="list-disc list-inside space-y-2 text-zinc-400">
            <li><strong className="text-zinc-300">Account data:</strong> Retained as long as your account exists. Deleted permanently when you delete your account.</li>
            <li><strong className="text-zinc-300">Anonymous posts:</strong> Retained indefinitely as they are not linked to any identity.</li>
            <li><strong className="text-zinc-300">IP addresses:</strong> Retained for up to 30 days for abuse prevention, then permanently deleted via automated purge.</li>
            <li><strong className="text-zinc-300">Location data:</strong> Stored as approximate coordinates only. Retained as long as the associated post exists.</li>
            <li><strong className="text-zinc-300">Server logs:</strong> Temporary request logs may contain IP addresses and are automatically purged within 30 days.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">9. Children&apos;s Privacy</h2>
          <p className="text-zinc-400">
            OneWord is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">10. International Users</h2>
          <p className="text-zinc-400">
            OneWord is operated from India. If you access the Service from outside India, your data may be transferred to and processed in India. By using the Service, you consent to this transfer. We handle all data in accordance with this privacy policy regardless of where you are located.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">11. Changes to This Policy</h2>
          <p className="text-zinc-400">
            We may update this policy from time to time. Significant changes will be communicated via the app. The &quot;last updated&quot; date at the top reflects the most recent revision.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">12. Contact</h2>
          <p className="text-zinc-400">
            Questions about this policy? Reach out at{' '}
            <a href="mailto:hello@sayoneword.com" className="text-purple-400 hover:text-purple-300">
              hello@sayoneword.com
            </a>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-zinc-800 text-sm text-zinc-500">
        <Link href="/terms" className="text-purple-400 hover:text-purple-300">
          Terms of Service →
        </Link>
      </div>
    </main>
  )
}
