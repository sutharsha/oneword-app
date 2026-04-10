import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'OneWord terms of service — rules for using the platform.',
}

export default function TermsOfService() {
  const lastUpdated = 'April 11, 2026'

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-zinc-300">
      <Link href="/" className="text-purple-400 hover:text-purple-300 text-sm mb-8 inline-block">
        ← Back to OneWord
      </Link>

      <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-sm text-zinc-500 mb-8">Last updated: {lastUpdated}</p>

      <div className="space-y-8 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance</h2>
          <p className="text-zinc-400">
            By using OneWord (&quot;the Service&quot;), you agree to these terms. If you don&apos;t agree, please don&apos;t use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">2. The Service</h2>
          <p className="text-zinc-400">
            OneWord is a social platform where users respond to daily prompts with a single word. You can post as a registered user or anonymously.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">3. Your Account</h2>
          <ul className="list-disc list-inside space-y-2 text-zinc-400">
            <li>You&apos;re responsible for keeping your login credentials secure.</li>
            <li>One account per person. Don&apos;t create accounts to manipulate the feed or leaderboard.</li>
            <li>You can delete your account at any time. This permanently removes your data.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">4. Content Rules</h2>
          <p className="mb-3 text-zinc-400">Your one word must not be:</p>
          <ul className="list-disc list-inside space-y-2 text-zinc-400">
            <li>Hate speech, slurs, or targeted harassment.</li>
            <li>Spam or promotional content.</li>
            <li>Personally identifiable information about others.</li>
          </ul>
          <p className="mt-3 text-zinc-400">
            We reserve the right to remove content and suspend accounts that violate these rules. It&apos;s one word — keep it civil.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">5. Your Content</h2>
          <p className="text-zinc-400">
            You own the words you post (well, as much as anyone can own a single word). By posting, you grant OneWord a non-exclusive license to display your content on the platform, in share images, and in aggregate visualizations (like the word map).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">6. Location Data</h2>
          <p className="text-zinc-400">
            When you post a word, we derive your approximate city-level location from your IP address for use in our word map feature. We do not store your IP address — only the approximate coordinates. See our{' '}
            <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
              Privacy Policy
            </Link>{' '}
            for details.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">7. Availability</h2>
          <p className="text-zinc-400">
            OneWord is provided &quot;as is.&quot; We do our best to keep it running, but we don&apos;t guarantee 100% uptime. We may modify or discontinue features at any time.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
          <p className="text-zinc-400">
            OneWord is a free, experimental social platform. To the maximum extent permitted by law, we are not liable for any damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">9. Changes</h2>
          <p className="text-zinc-400">
            We may update these terms as the platform evolves. Continued use after changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
          <p className="text-zinc-400">
            Questions? Reach out at{' '}
            <a href="mailto:hello@sayoneword.com" className="text-purple-400 hover:text-purple-300">
              hello@sayoneword.com
            </a>
          </p>
        </section>
      </div>

      <div className="mt-12 pt-8 border-t border-zinc-800 text-sm text-zinc-500">
        <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
          ← Privacy Policy
        </Link>
      </div>
    </main>
  )
}
