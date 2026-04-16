type AccessStatusBadgeProps = {
  status: string | null;
  level: string | null;
  compact?: boolean;
  inverse?: boolean;
};

export function AccessStatusBadge({ status, level, compact = false, inverse = false }: AccessStatusBadgeProps) {
  const tone =
    status === "active" && level === "full"
      ? inverse
        ? "bg-[#eafaf2]/20 text-white"
        : "bg-[#eafaf2] text-[#0f7b53]"
      : status === "expired" || status === "cancelled"
        ? inverse
          ? "bg-[#fff1f0]/20 text-white"
          : "bg-[#fff1f0] text-[#a83836]"
        : inverse
          ? "bg-white/20 text-white"
          : "bg-[#f4f3fa] text-[#5b48d6]";

  const label =
    status === "active" && level === "full"
      ? "Paid access active"
      : status === "expired" || status === "cancelled"
        ? "Access inactive"
        : "Preview access";

  return (
    <span className={`inline-flex items-center rounded-full ${compact ? "px-3 py-1" : "px-4 py-1"} text-[10px] font-bold uppercase tracking-[0.18em] ${tone}`}>
      {label}
    </span>
  );
}
