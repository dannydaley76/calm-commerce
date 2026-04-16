import type { ReactNode } from "react";

export function PageHero({
  label,
  title,
  description,
  children,
}: {
  label?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-[#e6f2ff] px-8 py-10">
      {label ? <p className="font-[Inter] text-[11px] font-medium uppercase tracking-[0.05em] text-[#545a95]">{label}</p> : null}
      <h1 className="mt-3 font-[Manrope] text-[32px] font-bold leading-[1.2] text-[#003748]">{title}</h1>
      {description ? <p className="mt-3 max-w-[640px] font-[Manrope] text-[15px] leading-[1.7] text-[#49636f]">{description}</p> : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

export function SectionShell({
  label,
  title,
  description,
  children,
}: {
  label?: string;
  title?: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl bg-[#e6f2ff] px-8 py-8">
      {label ? <p className="font-[Inter] text-[11px] font-medium uppercase tracking-[0.05em] text-[#545a95]">{label}</p> : null}
      {title ? <h2 className="mt-3 font-[Manrope] text-[24px] font-semibold leading-[1.3] text-[#003748]">{title}</h2> : null}
      {description ? <p className="mt-2 max-w-[640px] font-[Manrope] text-[14px] leading-[1.6] text-[#49636f]">{description}</p> : null}
      <div className={label || title || description ? "mt-6" : undefined}>{children}</div>
    </section>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg bg-[#d9edff] p-6 ${className}`.trim()}>{children}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg bg-white p-5 ${className}`.trim()}>{children}</div>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-[Inter] text-[11px] font-medium uppercase tracking-[0.05em] text-[#49636f] ${className}`.trim()}>{children}</p>;
}

export function PrimaryButton({ children, href, className = "" }: { children: ReactNode; href: string; className?: string }) {
  return (
    <a href={href} className={`inline-flex items-center justify-center rounded-lg bg-[#545a95] px-6 py-3 text-[13px] font-medium text-white transition hover:opacity-95 ${className}`.trim()}>
      {children}
    </a>
  );
}

export function SecondaryButton({ children, href, className = "" }: { children: ReactNode; href: string; className?: string }) {
  return (
    <a href={href} className={`inline-flex items-center justify-center rounded-lg border border-[rgba(84,90,149,0.25)] px-6 py-3 text-[13px] font-medium text-[#545a95] transition hover:bg-white ${className}`.trim()}>
      {children}
    </a>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-[#d9edff]">
      <div className="h-full rounded-full bg-[#006b5f]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }}></div>
    </div>
  );
}
