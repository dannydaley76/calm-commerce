import Image from "next/image";

export function OnlineStoreFlowFigure() {
  return (
    <figure className="overflow-hidden rounded-[2rem] bg-white shadow-[0px_24px_48px_rgba(11,42,57,0.06)] ring-1 ring-[#eceaf5]">
      <Image
        src="/images/how-an-online-store-works.png"
        alt="Diagram showing how an online store works in three steps: see the offer, buy it, and get the product."
        width={1400}
        height={1000}
        className="hidden h-auto w-full md:block"
        priority={false}
      />
      <Image
        src="/images/how-an-online-store-works-mobile.png"
        alt="Mobile diagram showing how an online store works in three steps: see the offer, buy it, and get the product."
        width={900}
        height={1400}
        className="h-auto w-full md:hidden"
        priority={false}
      />
    </figure>
  );
}

const calmStartRules = [
  {
    title: "Start simple",
    body: "Keep the first version small, clear, and workable.",
  },
  {
    title: "Focus on evidence",
    body: "Let real signals guide decisions, not guesses or excitement.",
  },
  {
    title: "Work within your limits",
    body: "Build around real time, money, and energy constraints.",
  },
  {
    title: "Stay consistent",
    body: "Small repeated action beats occasional intensity.",
  },
  {
    title: "Avoid unnecessary complexity",
    body: "Do not add tools, features, or systems too early.",
  },
  {
    title: "Improve as you learn",
    body: "Start with something workable, then refine from feedback.",
  },
] as const;

export function CalmStartRulesFramework() {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-[0px_24px_48px_rgba(11,42,57,0.06)] ring-1 ring-[#eceaf5] md:p-8">
      <div className="max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cobalt-600">Framework</p>
        <h3 className="mt-3 font-[Manrope] text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">Calm-Start Rules</h3>
        <p className="mt-4 text-base leading-7 text-ink-500">
          A simple operating system for getting started without panic, noise, or overcomplication.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {calmStartRules.map((rule) => (
          <div key={rule.title} className="rounded-[1.5rem] bg-[#faf8fe] p-5 ring-1 ring-[#eceaf5]">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Rule</p>
            <h4 className="mt-3 font-[Manrope] text-xl font-bold tracking-tight text-ink-900">{rule.title}</h4>
            <p className="mt-3 text-sm leading-6 text-ink-500">{rule.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const founderRuleExamples = [
  {
    label: "Time budget",
    value: "6 hours per week",
    note: "Specific",
    body: "A clear time limit protects the plan from becoming unrealistic.",
  },
  {
    label: "Money cap",
    value: "£150 per month",
    note: "Realistic",
    body: "A manageable cap limits downside risk and keeps the experiment calm.",
  },
  {
    label: "Success metrics",
    value: "3+ sales or 20 email signups in 14 days",
    note: "Measurable",
    body: "Hard numbers make progress easier to judge honestly.",
  },
  {
    label: "Kill criteria",
    value: "Stop if there are no sales and no strong engagement after 3 tests",
    note: "Decision-guiding",
    body: "A stop rule protects you from continuing just because you feel attached to the idea.",
  },
] as const;

export function FounderRulesExample() {
  return (
    <section className="rounded-[2rem] bg-white p-6 shadow-[0px_24px_48px_rgba(11,42,57,0.06)] ring-1 ring-[#eceaf5] md:p-8">
      <div className="max-w-3xl">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#006d4a]">Worked example</p>
        <h3 className="mt-3 font-[Manrope] text-3xl font-extrabold tracking-tight text-ink-900 md:text-4xl">Example Founder Rules</h3>
        <p className="mt-4 text-base leading-7 text-ink-500">
          A useful Founder Rules Sheet gives you practical limits and decision rules you can actually use.
        </p>
      </div>

      <div className="mt-8 grid gap-5">
        {founderRuleExamples.map((item) => (
          <div key={item.label} className="grid gap-4 rounded-[1.5rem] bg-[#faf8fe] p-5 ring-1 ring-[#eceaf5] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">{item.label}</p>
              <p className="mt-3 font-[Manrope] text-xl font-bold tracking-tight text-ink-900">{item.value}</p>
            </div>
            <div className="rounded-[1.25rem] bg-white px-4 py-4 ring-1 ring-[#e5f4ec]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#006d4a]">{item.note}</p>
              <p className="mt-3 text-sm leading-6 text-ink-500">{item.body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
