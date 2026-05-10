import Link from "next/link";
import { PrimaryButton, SecondaryButton } from "@/components/design-system";
import { ScoutLogo } from "@/components/calm-commerce-logo";
import { BILLING_PLANS, type BillingPlanCode } from "@/lib/billing/products";
import { getAccessStateForCurrentUser } from "@/lib/auth/get-access-state";

const INSTALL_ANCHOR = "#pricing";
const WORKSPACE_PATH = "/ideas";

async function isSignedIn() {
  try {
    const access = await getAccessStateForCurrentUser();
    return access.authenticated;
  } catch {
    return false;
  }
}

function signupHref(nextPath: string) {
  return `/signup?next=${encodeURIComponent(nextPath)}`;
}

function checkoutHref(planCode: BillingPlanCode, signedIn: boolean) {
  const checkoutPath = `/upgrade?plan=${encodeURIComponent(planCode)}`;
  return signedIn ? checkoutPath : signupHref(checkoutPath);
}

function freeHref(signedIn: boolean) {
  return signedIn ? WORKSPACE_PATH : signupHref(WORKSPACE_PATH);
}

function SectionHeader({
  eyebrow,
  title,
  body,
  dark = false,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  dark?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <p className={["text-[10px] font-bold uppercase tracking-[0.18em]", dark ? "text-teal-500" : "text-cobalt-700"].join(" ")}>
          {eyebrow}
        </p>
      ) : null}
      <h2 className={["mt-3 font-[Manrope] text-3xl font-bold tracking-tight lg:text-5xl", dark ? "text-white" : "text-ink-900"].join(" ")}>
        {title}
      </h2>
      {body ? (
        <p className={["mt-4 text-base leading-8", dark ? "text-white/70" : "text-ink-700"].join(" ")}>
          {body}
        </p>
      ) : null}
    </div>
  );
}

function CheckItem({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <li className={["flex gap-3 text-sm leading-7", dark ? "text-white/75" : "text-ink-800"].join(" ")}>
      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cobalt-600" />
      <span>{children}</span>
    </li>
  );
}

function ScoutMockup() {
  const rows = [
    ["Demand", "bg-teal-600", 4],
    ["Competition", "bg-cobalt-600", 3],
    ["Trend", "bg-teal-600", 4],
    ["Margin potential", "bg-amber-500", 3],
  ];

  return (
    <div className="rounded-xl bg-surface-sunken p-8 shadow-[0_24px_60px_rgba(11,42,57,0.16)] ring-1 ring-ink-100/80">
      <div className="rounded-xl border border-ink-100 bg-surface-raised p-6 shadow-[0_18px_44px_rgba(11,42,57,0.12)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-[Manrope] text-base font-bold text-ink-900">Scout Analysis</p>
            <span className="mt-4 inline-flex rounded-lg bg-teal-100 px-4 py-2 text-xs font-bold text-teal-700">
              Strong research signal
            </span>
          </div>
          <p className="font-[Manrope] text-3xl font-bold text-teal-600">7.2/10</p>
        </div>
        <div className="mt-6 space-y-4">
          {rows.map(([label, color, filled]) => (
            <div key={label} className="grid grid-cols-[140px_1fr] items-center gap-4">
              <p className="text-sm font-semibold text-ink-700">{label}</p>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, index) => (
                  <span
                    key={index}
                    className={[
                      "h-1.5 flex-1 rounded-full",
                      index < Number(filled) ? color : "bg-ink-100",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const problemQuestions = [
  "Is the demand real, or already fading?",
  "Will the margin survive shipping, fees, and ad costs?",
  "Can you compete, or is the market locked up?",
  "Is the timing right, or are you buying a trend on the way down?",
];

const productBenefits = [
  "Score every product on demand, competition, trend, pricing, and risk",
  "See the unit economics before you contact a single supplier",
  "Get a plain-English verdict so you know exactly what to do next",
  "Save your best ideas into a workspace built for serious sellers",
  "Build a real shortlist instead of a graveyard of browser tabs",
  "Move faster, with confidence. No more second-guessing",
];

const workflow = [
  ["Open a product page", "Browse like you always do."],
  ["Click Scout", "Your research snapshot loads in seconds."],
  ["Review the signals", "Score, verdict, economics, all in one view."],
  ["Save to Workspace", "Build your shortlist before you spend a thing."],
];

const signals = [
  ["Demand", "Real buying activity, not vanity metrics. Know if the market actually exists."],
  ["Competition", "See exactly what you're up against and whether there's room to win."],
  ["Trend", "Catch products on the way up. Avoid the ones on the way down."],
  ["Pricing & margin", "Preview the numbers before you talk to suppliers. If the math doesn't work, walk away."],
  ["Risk & feasibility", "Spot the gotchas early: tricky variants, shipping headaches, compliance traps."],
  ["Confidence", "Know when the data is solid and when you need to dig deeper."],
];

const workspaceBenefits = [
  "One home for every idea. No more lost tabs or messy spreadsheets",
  "Side-by-side comparisons so the best products rise to the top",
  "Notes on every product to capture supplier quotes, ad ideas, and gut checks",
  "A real shortlist you can actually act on",
  "Built for the way decisions actually get made, not how spreadsheets pretend they do",
];

const useCases = [
  "Vetting AliExpress products before a dropshipping test",
  "Sizing up Amazon opportunities",
  "Running quick checks on TikTok finds",
  "Shortlisting wholesale or private label candidates",
  "Pricing out margin viability before sourcing",
  "Stress-testing a hero product before a restock",
  "Scaling research across dozens of products a week",
  "Comparing options side-by-side before committing",
  "Briefing suppliers and partners with evidence, not guesses",
  "Organising research before placing your first stock order",
];

const faqs = [
  ["What does a high score mean?", "Strong signals across demand, competition, and economics. It means the product is worth your time and a closer look. It does not guarantee sales."],
  ["Which platforms does Scout scan?", "Scout works on AliExpress and Amazon out of the box. Scout Pro scans any product page on the web."],
  ["What is Scout Workspace?", "Your research command centre. Save, organise, compare, and shortlist every product you scan in one place."],
  ["Is Scout only for dropshipping?", "Not at all. Dropshippers, wholesalers, marketplace sellers, and private label brands can all use Scout to make sharper product calls."],
  ["How is Scout different from other research tools?", "Most tools chase winning products. Scout tells you whether a product is worth testing, given its signals, economics, competition, and risk."],
  ["What is Calm Commerce?", "The full ecommerce operating system Scout leads into. It helps you move from product idea to numbers, tests, metrics, and store decisions."],
];

export default async function ScoutLandingPage() {
  const signedIn = await isSignedIn();
  const freeTrialHref = freeHref(signedIn);
  const plans = [
    {
      name: "Free Trial",
      price: "Free",
      cadence: "to start",
      description: "Try the research flow before you pay.",
      features: ["Limited scans", "AliExpress and Amazon", "Score and signals preview", "Limited Workspace saves"],
      cta: "Try free",
      href: freeTrialHref,
      featured: false,
    },
    {
      ...BILLING_PLANS.scout_basic,
      price: "£5",
      cadence: "one-time",
      cta: "Get Basic",
      href: checkoutHref("scout_basic", signedIn),
      featured: true,
    },
    {
      ...BILLING_PLANS.scout_pro,
      price: "£9",
      cadence: "/month",
      cta: "Start Pro",
      href: checkoutHref("scout_pro", signedIn),
      featured: false,
    },
    {
      name: "Calm Commerce",
      price: "Included",
      cadence: "with OS",
      description: "Scout bundled with the full Calm Commerce operating system.",
      features: ["Everything in Scout Pro", "Calm Commerce OS", "Guided product testing", "Lean Canvas and metrics"],
      cta: "Coming soon",
      href: null,
      featured: false,
    },
  ];

  return (
    <main className="min-h-screen bg-white text-ink-900">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
          <Link href="/scout" aria-label="Scout home">
            <ScoutLogo size={40} />
          </Link>
          <div className="flex items-center gap-5">
            <nav className="hidden items-center gap-6 text-sm font-semibold text-ink-800 md:flex">
              <a href="#pricing" className="transition hover:text-cobalt-600">Pricing</a>
              <a href="#how-it-works" className="transition hover:text-cobalt-600">How it works</a>
            </nav>
            <PrimaryButton href={INSTALL_ANCHOR} className="px-5 py-2.5">
              Install Scout
            </PrimaryButton>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-16 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-24">
        <div>
          <h1 className="font-[Manrope] text-5xl font-bold leading-[1.12] tracking-tight text-ink-900 lg:text-6xl">
            Every signal that matters. Every idea in one place.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-ink-700">
            Scout reads every product page in seconds, scores the signals that decide whether it&apos;s worth testing, and saves your shortlist into one organised workspace. Make the call with evidence, before you spend.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <PrimaryButton href={INSTALL_ANCHOR}>Install Scout</PrimaryButton>
            <SecondaryButton href="#how-it-works">See how it works</SecondaryButton>
          </div>
        </div>
        <ScoutMockup />
      </section>

      <section className="bg-ink-900 px-5 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-4xl">
            <h2 className="font-[Manrope] text-4xl font-bold leading-tight lg:text-6xl">
              Drowning in products. <span className="text-teal-600">Starving for signals.</span>
            </h2>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-white/75">
              Whether it&apos;s your first product or your fiftieth, the chaos is the same. TikTok finds, AliExpress bestsellers, Amazon hot lists, supplier DMs, the product a friend swears is about to blow up. Every one looks like it could be the one.
            </p>
            <p className="mt-6 text-lg leading-8 text-white/80">But staring at a product page, you can&apos;t actually tell:</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {problemQuestions.map((question) => (
              <div key={question} className="rounded-xl border border-white/10 bg-white/5 p-5 text-lg font-semibold text-white">
                {question}
              </div>
            ))}
          </div>
          <p className="mt-10 text-xl font-semibold text-white">
            The answers are in the signals. <span className="text-teal-600">Scout reads them in seconds.</span>
          </p>
        </div>
      </section>

      <section id="how-it-works" className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="What Scout is"
            title="Read any product page like a pro."
            body="Open any product page. Click Scout. Get a clear verdict in seconds."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {productBenefits.map((benefit) => (
              <div key={benefit} className="rounded-xl border border-ink-200 bg-surface-raised p-6 shadow-[0_14px_34px_rgba(11,42,57,0.08)]">
                <CheckItem>{benefit}</CheckItem>
              </div>
            ))}
          </div>
          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {workflow.map(([title, body], index) => (
              <article key={title} className="rounded-xl border border-ink-200 bg-white p-6 shadow-[0_14px_34px_rgba(11,42,57,0.08)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cobalt-700 font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-5 font-[Manrope] text-xl font-bold text-ink-900">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-700">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-canvas px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title="Six signals. One clear answer." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {signals.map(([title, body]) => (
              <article key={title} className="rounded-xl border border-ink-200 bg-white p-6 shadow-[0_14px_34px_rgba(11,42,57,0.08)]">
                <h3 className="font-[Manrope] text-xl font-bold text-ink-900">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-700">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-700">Scout Workspace</p>
            <h2 className="mt-3 font-[Manrope] text-4xl font-bold tracking-tight text-ink-900 lg:text-5xl">
              Your product research, finally organised.
            </h2>
            <p className="mt-5 text-lg leading-8 text-ink-700">
              Every idea you save flows through a simple funnel: New, Reviewing, Shortlist, Testing, Archived.
            </p>
            <ul className="mt-7 space-y-2">
              {workspaceBenefits.map((benefit) => (
                <CheckItem key={benefit}>{benefit}</CheckItem>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 rounded-xl bg-surface-sunken p-5 shadow-[0_18px_48px_rgba(11,42,57,0.1)] ring-1 ring-ink-100">
            {["New", "Reviewing", "Shortlist", "Testing", "Archived"].map((stage, stageIndex) => (
              <div key={stage} className="rounded-xl border border-ink-200 bg-white p-4 shadow-[0_10px_24px_rgba(11,42,57,0.07)]">
                <div className="flex items-center justify-between">
                  <p className="font-[Manrope] text-lg font-bold text-ink-900">{stage}</p>
                  <span className="rounded-full bg-cobalt-100 px-3 py-1 text-xs font-bold text-cobalt-700">
                    {[3, 2, 4, 1, 5][stageIndex]}
                  </span>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {Array.from({ length: stageIndex === 3 ? 1 : 2 }).map((_, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg bg-surface-canvas px-3 py-2 ring-1 ring-ink-100">
                      <span className="text-sm font-semibold text-ink-800">Product {index + 1}</span>
                      <span className="text-sm font-bold text-teal-600">{(7 + index * 0.5).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="bg-surface-canvas px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            eyebrow="Pricing"
            title="Start small. Upgrade when the research gets serious."
            body="Try the workflow, unlock core scanning, or go Pro for deeper signals across more product pages."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={[
                  "relative flex rounded-xl border bg-white p-6 shadow-[0_16px_40px_rgba(11,42,57,0.09)]",
                  plan.featured ? "border-cobalt-700 ring-2 ring-cobalt-100" : "border-ink-200",
                ].join(" ")}
              >
                <div className="flex min-h-full w-full flex-col">
                  {plan.featured ? (
                    <span className="mb-4 inline-flex w-fit rounded-full bg-cobalt-700 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white">
                      Most popular
                    </span>
                  ) : null}
                  <h3 className="font-[Manrope] text-2xl font-bold text-ink-900">{plan.name}</h3>
                  <div className="mt-4">
                    <span className="font-[Manrope] text-3xl font-bold text-ink-900">{plan.price}</span>
                    <span className="ml-2 text-sm font-semibold text-ink-600">{plan.cadence}</span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-ink-700">{plan.description}</p>
                  <ul className="mt-5 space-y-2">
                    {plan.features.map((feature) => (
                      <CheckItem key={feature}>{feature}</CheckItem>
                    ))}
                  </ul>
                  <div className="mt-auto pt-7">
                    {plan.href ? (
                      plan.featured ? (
                        <PrimaryButton href={plan.href} className="w-full">{plan.cta}</PrimaryButton>
                      ) : (
                        <SecondaryButton href={plan.href} className="w-full">{plan.cta}</SecondaryButton>
                      )
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-lg border border-ink-200 bg-surface-sunken px-6 py-3 text-[13px] font-semibold text-ink-600"
                      >
                        {plan.cta}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-8 text-center text-sm font-semibold text-ink-600">
            Most sellers pick Pro. Scan anywhere, save everything, decide faster.
          </p>
        </div>
      </section>

      <section className="bg-ink-900 px-5 py-20 text-white lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            dark
            eyebrow="Trust"
            title="Trusted by sellers who back evidence"
            body="Scout is built for sellers who want a product research process, not a lucky guess."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {[
              ["I used to lose hours bouncing between TikTok finds and AliExpress tabs. Scout cut my research time in half and I've actually got a shortlist I trust now.", "Priya R.", "dropshipper, Manchester"],
              ["The economics preview alone saved me from ordering 200 units of something that would've made me £1.80 a sale. Worth ten times what I paid.", "Marcus T.", "side-hustle seller"],
              ["Finally a tool that doesn't promise me a winning product. It just gives me the evidence and lets me decide. Exactly what I needed starting out.", "Jen K.", "private label seller"],
            ].map(([quote, name, role]) => (
              <figure key={name} className="rounded-xl border border-white/10 bg-white/5 p-6">
                <blockquote className="text-base leading-8 text-white/85">&ldquo;{quote}&rdquo;</blockquote>
                <figcaption className="mt-5">
                  <p className="font-bold text-white">{name}</p>
                  <p className="text-sm text-white/55">{role}</p>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-10 grid gap-4 text-sm font-semibold text-white/80 sm:grid-cols-2 lg:grid-cols-4">
            {["Built for sellers at every stage", "Evidence-first methodology", "Early-access pricing", "Real signals, no inflated claims"].map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-white/5 p-4">{item}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader title="Scout works for you whether you're:" />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {useCases.map((item) => (
              <div key={item} className="rounded-xl border border-ink-200 bg-surface-raised p-5 shadow-[0_12px_30px_rgba(11,42,57,0.075)]">
                <CheckItem>{item}</CheckItem>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-canvas px-5 py-20 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <SectionHeader title="Questions before you scan?" />
          <div className="mt-10 divide-y divide-ink-100 rounded-xl border border-ink-200 bg-white shadow-[0_18px_44px_rgba(11,42,57,0.09)]">
            {faqs.map(([question, answer]) => (
              <details key={question} className="group p-6">
                <summary className="cursor-pointer list-none font-[Manrope] text-lg font-bold text-ink-900">
                  {question}
                </summary>
                <p className="mt-3 text-sm leading-7 text-ink-700">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-20 text-center lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-[Manrope] text-4xl font-bold tracking-tight text-ink-900 lg:text-5xl">
            Test your next product idea with evidence.
          </h2>
          <p className="mt-5 text-lg leading-8 text-ink-700">
            Install Scout, scan the product page, and decide whether it deserves a place in your shortlist.
          </p>
          <div className="mt-8 flex justify-center">
            <PrimaryButton href={INSTALL_ANCHOR}>Install Scout</PrimaryButton>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-100 bg-white px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 text-sm text-ink-500 lg:flex-row lg:items-start lg:justify-between">
          <ScoutLogo size={36} />
          <p className="max-w-2xl leading-7">
            Scout provides research signals and decision support, not guaranteed sales outcomes. You are responsible for your own purchasing, stock, pricing, supplier, compliance, advertising, and selling decisions.
          </p>
        </div>
      </footer>
    </main>
  );
}
