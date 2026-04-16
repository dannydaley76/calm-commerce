import Link from "next/link";

type AccessLockedCardProps = {
  title?: string;
  body?: string;
};

export function AccessLockedCard({
  title = "Unlock full access",
  body = "Your account is active in the app, but this area is part of the paid learning experience. Upgrade or reactivate to continue.",
}: AccessLockedCardProps) {
  return (
    <div className="rounded-[2rem] border border-[#d8d5ff] bg-[#f7f5ff] p-6 shadow-[0px_16px_32px_rgba(48,50,59,0.04)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#5b48d6]">Access</p>
      <h2 className="mt-3 font-[Manrope] text-2xl font-extrabold tracking-tight text-[#2f2766]">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5d5f68]">{body}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/upgrade" className="inline-flex items-center justify-center rounded-xl bg-[#5b48d6] px-5 py-3 font-semibold !text-white">
          Upgrade access
        </Link>
        <Link href="/" className="inline-flex items-center justify-center rounded-xl border border-[#d7d9e6] bg-white px-5 py-3 font-semibold text-[#30323b]">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
