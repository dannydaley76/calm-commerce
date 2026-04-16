import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";

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
};

export function LearnerShell({ children, items, title, subtitle, showLogout = true }: LearnerShellProps) {
  return (
    <main className="min-h-screen bg-[#f4faff] text-[#003748]">
      <header className="sticky top-0 z-40 bg-[rgba(244,250,255,0.95)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-8 py-[14px]">
          <Link href="/" className="font-[Manrope] text-[15px] font-semibold text-[#545a95]">
            Calm Commerce
          </Link>

          <div className="flex items-center gap-4 lg:gap-6">
            <nav aria-label="Learner navigation" className="hidden flex-wrap items-center gap-6 md:flex">
              {items.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={[
                    "border-b-2 pb-[2px] text-[13px] text-[#49636f] transition",
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

      <div className="mx-auto max-w-[1000px] px-6 py-10 lg:px-8 lg:py-12">
        {(title || subtitle) && title !== "Dashboard" ? (
          <div className="mb-10">
            {title ? <h1 className="font-[Manrope] text-2xl font-semibold tracking-tight text-[#003748] lg:text-[30px] lg:leading-[1.25]">{title}</h1> : null}
            {subtitle ? <p className="mt-3 max-w-3xl text-base leading-[1.7] text-[#49636f]">{subtitle}</p> : null}
          </div>
        ) : null}

        {children}
      </div>
    </main>
  );
}
