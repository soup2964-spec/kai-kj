import { formatCardLabel } from "@/lib/card-last-four";

export function CardBadge({
  lastFour,
  size = "sm",
}: {
  lastFour: string | null | undefined;
  size?: "sm" | "md";
}) {
  const label = formatCardLabel(lastFour);
  const isUnknown = !lastFour;
  const sizeClass =
    size === "md"
      ? "rounded-md px-2.5 py-1 text-xs"
      : "rounded px-2 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold ${sizeClass} ${
        isUnknown
          ? "bg-qb-bg text-qb-text-muted"
          : "bg-[#fffaeb] text-[#93370d]"
      }`}
      title={label}
    >
      <span
        className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
          isUnknown ? "bg-qb-text-muted" : "bg-[#f59e0b]"
        }`}
      />
      {label}
    </span>
  );
}
