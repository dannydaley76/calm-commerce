import type { Metadata } from "next";
import Link from "next/link";
import { ScoutLogo } from "@/components/calm-commerce-logo";

export const metadata: Metadata = {
  title: "Privacy Policy | Calm Commerce",
  description: "Privacy policy for Calm Commerce and the Scout Chrome extension.",
};

const updatedDate = "13 May 2026";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-[Manrope] text-xl font-bold text-ink-900">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-ink-700">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-6">
          <Link href="/scout" className="inline-flex items-center gap-3 text-ink-900">
            <ScoutLogo className="h-8 w-8" />
            <span className="font-[Manrope] text-lg font-bold">Calm Commerce</span>
          </Link>
          <Link
            href="/scout"
            className="text-sm font-semibold !text-cobalt-600 underline-offset-4 hover:!text-cobalt-700 hover:underline"
          >
            Back to Scout
          </Link>
        </header>

        <article className="mt-10 rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-card md:p-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">
            Privacy policy
          </p>
          <h1 className="mt-3 font-[Manrope] text-3xl font-bold tracking-tight text-ink-900 md:text-4xl">
            Calm Commerce and Scout privacy policy
          </h1>
          <p className="mt-4 text-sm leading-7 text-ink-700">
            Last updated: {updatedDate}
          </p>
          <p className="mt-4 text-sm leading-7 text-ink-700">
            Calm Commerce provides the Scout Chrome extension and Scout Workspace. This policy explains what
            information we collect, why we collect it, and how it is used.
          </p>

          <div className="mt-10 space-y-9">
            <Section title="Information we collect">
              <p>
                When you create an account, we collect account information such as your email address and authentication
                identifiers. We use Supabase to provide account authentication.
              </p>
              <p>
                When you use Scout to scan or save a product, we may collect product page information selected by you,
                including the product URL, page title, product title, product image, listed price, ratings, review
                counts, order counts, variants, marketplace or platform name, page metadata, and scan timestamp.
              </p>
              <p>
                When you use Scout Workspace, we collect the product ideas you save, status changes, notes, economics
                inputs, and other information you add while reviewing product candidates.
              </p>
              <p>
                The Scout extension may store local settings in your browser, including connection state, recent scan
                state, and a token used to connect Scout Pro to your Calm Commerce account.
              </p>
            </Section>

            <Section title="How we use information">
              <p>
                We use this information to scan product pages, generate product research signals, save products to Scout
                Workspace, manage your account, provide paid access, enforce fair-use limits, and improve reliability.
              </p>
              <p>
                For Scout Pro users, product page text and metadata may be sent to the Calm Commerce research service so
                it can return structured research data such as demand signals, competition notes, trend direction, risk
                notes, and extracted product facts.
              </p>
            </Section>

            <Section title="Payments">
              <p>
                Payments are processed by Stripe. We do not collect or store full credit card numbers. Stripe may process
                payment details, billing information, and transaction records according to its own privacy policy.
              </p>
            </Section>

            <Section title="What the Scout extension accesses">
              <p>
                Scout reads product page content only when you choose to scan a page. It does not continuously monitor
                your browsing activity. The extension uses browser permissions to inspect the active product page, save
                settings, open Scout Workspace, and connect to Calm Commerce services.
              </p>
              <p>
                Scout does not download or execute remote code. Remote services return structured data for analysis; the
                extension code itself is packaged inside the Chrome extension.
              </p>
            </Section>

            <Section title="Sharing information">
              <p>
                We do not sell your personal information. We share information with service providers only where needed
                to operate the product, including Supabase for authentication and database storage, Stripe for payments,
                Vercel for hosting, and Railway for the Scout research service.
              </p>
            </Section>

            <Section title="Data retention and deletion">
              <p>
                We keep account and workspace information for as long as your account is active or as needed to provide
                the service. You can request deletion of your account or product data by contacting us.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                For privacy questions or deletion requests, contact us at{" "}
                <a
                  href="mailto:hello@calmcommerce.net"
                  className="font-semibold !text-cobalt-600 underline-offset-4 hover:!text-cobalt-700 hover:underline"
                >
                  hello@calmcommerce.net
                </a>
                .
              </p>
            </Section>
          </div>
        </article>
      </div>
    </main>
  );
}
