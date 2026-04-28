import type { ReactNode } from "react";

/* ─────────────────────────────────────────────────────────────────────
   Structural components
   ───────────────────────────────────────────────────────────────────── */

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
    <section className="rounded-xl bg-surface-raised border border-ink-100 shadow-card px-8 py-10">
      {label ? <p className="font-[Inter] text-[11px] font-medium uppercase tracking-[0.05em] text-[#545a95]">{label}</p> : null}
      <h1 className="mt-3 font-[Manrope] text-[32px] font-bold leading-[1.2] text-ink-900">{title}</h1>
      {description ? <p className="mt-3 max-w-[640px] font-[Manrope] text-[15px] leading-[1.7] text-ink-700">{description}</p> : null}
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
    <section className="rounded-xl bg-surface-raised border border-ink-100 shadow-card px-8 py-8">
      {label ? <p className="font-[Inter] text-[11px] font-medium uppercase tracking-[0.05em] text-[#545a95]">{label}</p> : null}
      {title ? <h2 className="mt-3 font-[Manrope] text-[24px] font-semibold leading-[1.3] text-ink-900">{title}</h2> : null}
      {description ? <p className="mt-2 max-w-[640px] font-[Manrope] text-[14px] leading-[1.6] text-ink-700">{description}</p> : null}
      <div className={label || title || description ? "mt-6" : undefined}>{children}</div>
    </section>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg bg-cobalt-100 p-6 ${className}`.trim()}>{children}</div>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-lg bg-surface-raised border border-ink-100 shadow-card p-5 ${className}`.trim()}>{children}</div>;
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`font-[Inter] text-[11px] font-medium uppercase tracking-[0.05em] text-ink-700 ${className}`.trim()}>{children}</p>;
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-cobalt-100">
      <div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.max(0, Math.min(100, value))}%` }}></div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   Button / link system
   ─────────────────────────────────────────────────────────────────────
   All four variants share:
     • 150 ms transition on bg/text/border/shadow/transform
     • hover: subtle lift (motion-safe:-translate-y-px)
     • active: drop back to origin (motion-safe:active:translate-y-0)
     • focus-visible: cobalt-500 ring, 2px offset
     • disabled: 50% opacity, no pointer events
     • prefers-reduced-motion: transform/shadow elevation stripped
       (handled via motion-safe: prefix)
   ───────────────────────────────────────────────────────────────────── */

/** Shared transition classes applied to every button variant. */
const BTN_BASE =
  'inline-flex items-center justify-center rounded-lg ' +
  'text-[13px] font-medium select-none ' +
  'transition-[background-color,border-color,box-shadow,color,transform] ' +
  'duration-150 ease-out ' +
  // Disable the global button:hover border rule (it targets border-color)
  'hover:border-current ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cobalt-500 focus-visible:ring-offset-2 ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ' +
  'active:motion-safe:translate-y-0';

/**
 * Primary action button — cobalt fill, white text.
 *
 * hover  : cobalt-700 bg + elevated shadow + lift
 * active : cobalt-700 bg + inner shadow + land
 * focus  : cobalt-500 ring
 */
export function PrimaryButton({
  children,
  href,
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}) {
  const cls = [
    BTN_BASE,
    'px-6 py-3',
    'bg-cobalt-600 text-white border border-transparent',
    'shadow-[0_1px_2px_rgba(11,42,57,0.08)]',
    // hover
    'hover:bg-cobalt-700',
    'motion-safe:hover:-translate-y-px',
    'hover:shadow-[0_6px_14px_rgba(0,73,207,0.30)]',
    // active
    'active:shadow-[inset_0_1px_0_rgba(0,0,0,0.15)]',
    className,
  ].join(' ');

  if (href) {
    return <a href={href} className={cls}>{children}</a>;
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/**
 * Secondary action button — white/raised bg, ink border.
 *
 * hover  : sunken bg, cobalt border accent, lift + soft shadow
 * active : ink-100 bg + land
 * focus  : cobalt-500 ring
 */
export function SecondaryButton({
  children,
  href,
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}) {
  const cls = [
    BTN_BASE,
    'px-6 py-3',
    'bg-surface-raised text-ink-900 border border-ink-100',
    // hover
    'hover:bg-surface-sunken hover:border-cobalt-500',
    'motion-safe:hover:-translate-y-px',
    'hover:shadow-[0_4px_10px_rgba(11,42,57,0.08)]',
    // active
    'active:bg-ink-100',
    className,
  ].join(' ');

  if (href) {
    return <a href={href} className={cls}>{children}</a>;
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/**
 * Ghost / link-style button — text-only with an underline on hover.
 * On hover it gains a soft cobalt-100 pill behind the text to
 * increase the hit target without feeling heavy.
 *
 * Typically used for inline actions like "Edit →", "Go to Chapter X →".
 */
export function GhostButton({
  children,
  href,
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}) {
  const cls = [
    BTN_BASE,
    'px-3 py-1.5',
    'bg-transparent text-cobalt-600 border border-transparent',
    'underline-offset-4',
    // hover: underline + cobalt pill bg + subtle lift
    'hover:text-cobalt-700 hover:underline hover:bg-cobalt-100',
    'hover:rounded-full',
    'motion-safe:hover:-translate-y-px',
    // active
    'active:text-cobalt-700 active:bg-cobalt-100',
    className,
  ].join(' ');

  if (href) {
    return <a href={href} className={cls}>{children}</a>;
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}

/**
 * Destructive button — red fill, white text.
 * Used for irreversible actions (account deletion, data wipe).
 *
 * hover  : darker red + elevated shadow + lift
 * active : darker red + inner shadow + land
 * focus  : danger-600 ring (not cobalt, to signal danger context)
 */
export function DestructiveButton({
  children,
  href,
  onClick,
  type = "button",
  disabled,
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}) {
  const cls = [
    BTN_BASE,
    'px-6 py-3',
    'bg-danger-600 text-white border border-transparent',
    'shadow-[0_1px_2px_rgba(11,42,57,0.08)]',
    // Focus uses danger ring rather than cobalt to signal the danger context
    'focus-visible:ring-danger-600',
    // hover — darker red (#8E1A12 is ~1.5 stops darker than danger-600 #B42318)
    'hover:bg-[#8E1A12]',
    'motion-safe:hover:-translate-y-px',
    'hover:shadow-[0_6px_14px_rgba(180,35,24,0.30)]',
    // active
    'active:shadow-[inset_0_1px_0_rgba(0,0,0,0.15)]',
    className,
  ].join(' ');

  if (href) {
    return <a href={href} className={cls}>{children}</a>;
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
