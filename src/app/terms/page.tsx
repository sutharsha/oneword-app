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
          <div className="space-y-4 text-zinc-400">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL ONEWORD, ITS OWNER, CREATOR, OPERATORS, CONTRIBUTORS, OR ANY AFFILIATED INDIVIDUALS OR ENTITIES (&quot;THE ONEWORD PARTIES&quot;) BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES, INCLUDING BUT NOT LIMITED TO DAMAGES FOR LOSS OF PROFITS, GOODWILL, DATA, OR OTHER INTANGIBLE LOSSES, REGARDLESS OF WHETHER SUCH DAMAGES ARE BASED ON WARRANTY, CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, OR ANY OTHER LEGAL THEORY, AND REGARDLESS OF WHETHER THE ONEWORD PARTIES HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p>
              THE TOTAL AGGREGATE LIABILITY OF THE ONEWORD PARTIES FOR ALL CLAIMS ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU HAVE PAID TO USE THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED INDIAN RUPEES (₹100). AS THE SERVICE IS FREE, THIS EFFECTIVELY MEANS ZERO.
            </p>
            <p>
              YOU ACKNOWLEDGE THAT THE SERVICE IS PROVIDED FREE OF CHARGE, AND THAT THIS LIMITATION OF LIABILITY IS A FUNDAMENTAL PART OF THE AGREEMENT BETWEEN YOU AND ONEWORD WITHOUT WHICH THE SERVICE WOULD NOT BE PROVIDED.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">9. Disclaimers</h2>
          <div className="space-y-4 text-zinc-400">
            <div>
              <h3 className="text-zinc-200 font-medium mb-1">No Warranty</h3>
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
              </p>
            </div>
            <div>
              <h3 className="text-zinc-200 font-medium mb-1">User-Generated Content</h3>
              <p>
                Words, reactions, and any other content posted by users represent the views of the individual poster only — not OneWord, its creators, or its operators. We do not endorse, verify, or take responsibility for any user-generated content.
              </p>
            </div>
            <div>
              <h3 className="text-zinc-200 font-medium mb-1">Location Accuracy</h3>
              <p>
                The word map feature displays approximate locations derived from IP addresses. These locations may be inaccurate, especially for users on VPNs, mobile networks, or proxy services. The map is for entertainment and visualization purposes only — do not rely on it for any factual determination of a user&apos;s real-world location.
              </p>
            </div>
            <div>
              <h3 className="text-zinc-200 font-medium mb-1">Data Loss</h3>
              <p>
                While we take reasonable measures to protect your data, we cannot guarantee against data loss, corruption, or unauthorized access. You use the Service at your own risk. We strongly recommend not relying on OneWord as your sole record of anything important (though if your most important record is a single word, we have questions).
              </p>
            </div>
            <div>
              <h3 className="text-zinc-200 font-medium mb-1">External Links & Integrations</h3>
              <p>
                The Service may contain links to third-party websites or integrate with third-party services. We are not responsible for the content, privacy practices, or availability of any third-party resources.
              </p>
            </div>
            <div>
              <h3 className="text-zinc-200 font-medium mb-1">Indemnification</h3>
              <p>
                You agree to defend, indemnify, and hold harmless OneWord, its owner, creator, operators, contributors, and any affiliated individuals or entities (&quot;the OneWord Parties&quot;) from and against any and all claims, actions, suits, proceedings, damages, obligations, losses, liabilities, costs, and expenses (including but not limited to reasonable attorney&apos;s fees and legal costs) arising from or related to: (a) your use or misuse of the Service; (b) your content or any content posted through your account; (c) your violation of these Terms; (d) your violation of any third-party right, including any intellectual property, privacy, or proprietary right; or (e) any claim that your content caused damage to a third party. This indemnification obligation will survive the termination of your account and these Terms.
              </p>
            </div>
            <div>
              <h3 className="text-zinc-200 font-medium mb-1">Assumption of Risk</h3>
              <p>
                You expressly acknowledge and agree that your use of the Service is entirely at your own risk. The Service is a user-generated content platform, and you may be exposed to content that you find offensive, objectionable, or inappropriate. You waive any and all claims against the OneWord Parties relating to content posted by other users.
              </p>
            </div>
            <div>
              <h3 className="text-zinc-200 font-medium mb-1">No Liability for User Actions</h3>
              <p>
                The OneWord Parties are not responsible for the conduct of any user, whether online or offline. You are solely responsible for your interactions with other users. We do not conduct background checks, verify identities, or monitor user behavior beyond basic content moderation.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">10. Governing Law & Dispute Resolution</h2>
          <div className="space-y-4 text-zinc-400">
            <p>
              These terms are governed by and construed in accordance with the laws of India, without regard to conflict of law principles.
            </p>
            <p>
              Any dispute, controversy, or claim arising out of or relating to these Terms or the Service shall first be attempted to be resolved through good-faith negotiation for a period of thirty (30) days. If the dispute cannot be resolved through negotiation, it shall be settled by binding arbitration in Bangalore, Karnataka, India, in accordance with the Arbitration and Conciliation Act, 1996 (as amended).
            </p>
            <p>
              YOU AGREE THAT ANY CLAIMS SHALL BE BROUGHT IN YOUR INDIVIDUAL CAPACITY ONLY, AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING. You waive any right to participate in a class action or class-wide arbitration.
            </p>
            <p>
              The courts of Bangalore, Karnataka shall have exclusive jurisdiction over any proceedings that are not subject to arbitration under this section.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">11. Severability</h2>
          <p className="text-zinc-400">
            If any provision of these terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">12. Termination</h2>
          <div className="space-y-4 text-zinc-400">
            <p>
              We may suspend or terminate your access to the Service at any time, for any reason, without prior notice or liability. Upon termination, your right to use the Service ceases immediately.
            </p>
            <p>
              Sections 8 (Limitation of Liability), 9 (Disclaimers), 10 (Governing Law), and 11 (Severability) shall survive any termination of these Terms.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">13. Entire Agreement</h2>
          <p className="text-zinc-400">
            These Terms, together with the{' '}
            <Link href="/privacy" className="text-purple-400 hover:text-purple-300">
              Privacy Policy
            </Link>
            , constitute the entire agreement between you and OneWord regarding the Service. Any prior agreements, understandings, or representations are superseded by these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">14. Changes</h2>
          <p className="text-zinc-400">
            We may update these terms as the platform evolves. We will make reasonable efforts to notify users of material changes (e.g., via a banner on the Service). Continued use of the Service after changes are posted constitutes your acceptance of the revised Terms. If you disagree with the changes, your sole remedy is to stop using the Service and delete your account.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">15. Contact</h2>
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
