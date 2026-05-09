import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { CalmCommerceLogo } from "@/components/calm-commerce-logo";

export type LearnerNavItem = {
  href: string;
  label: string;
  active?: boolean;
};

type LearnerShellProps = {
  children: React.ReactNode;
  items: LearnerNavItem[];
  title?: string;
  subtitle?: string;
  showLogout?: boolean;
  /**
   * Maximum width for the page content area.
   * Defaults to '1000px' — the site-wide reading width.
   * Pass '1180px' for the Lean Canvas page so the wide business grid
   * shares the same horizontal edges as the header and tab strip.
   * Other pages must NOT pass this prop; they stay at 1000px.
   */
  contentWidth?: string;
};

export function LearnerShell({ children, items, title, subtitle, showLogout = true, contentWidth }: LearnerShellProps) {
  return (
    <main className="min-h-screen bg-surface-canvas text-ink-900">
      <header className="sticky top-0 z-40 bg-[rgba(234,241,245,0.95)]">
        {/* Site chrome is intentionally panoramic (1280) so it always frames page content. Pages use narrower widths: Lean Canvas 1180, all other pages 1000. Don't match the nav width to a page width — the chrome-vs-content stagger is the design. */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-8 py-[14px]">
          <Link href="/" aria-label="Calm Commerce — home">
            <CalmCommerceLogo variant="horizontal" size={36} />
          </Link>

          <div className="flex items-center gap-4 lg:gap-6">
            <nav aria-label="Learner navigation" className="hidden flex-wrap items-center gap-6 md:flex">
              {items.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={[
                    "border-b-2 pb-[2px] text-[13px] text-ink-700 transition",
                    item.active ? "border-[#545a95] font-medium text-[#545a95]" : "border-transparent hover:text-[#545a95]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            {showLogout ? <LogoutButton /> : null}
          </div>
        </div>
      </header>

      <div className="mx-auto px-6 py-10 lg:px-8 lg:py-12" style={{ maxWidth: contentWidth ?? '1000px' }}>
        {(title || subtitle) ? (
          <div className="mb-10">
            {title ? <h1 className="font-[Manrope] text-2xl font-semibold tracking-tight text-ink-900 lg:text-[30px] lg:leading-[1.25]">{title}</h1> : null}
            {subtitle ? <p className="mt-3 max-w-[640px] text-base leading-[1.7] text-ink-700">{subtitle}</p> : null}
          </div>
        ) : null}

        {children}
      </div>
    </main>
  );
}
