import type { BillableStatus } from "@/lib/types";

const BADGE_META: Record<
  BillableStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  billable: {
    label: "Billable",
    color: "#0365ac",
    bg: "#e8f4fd",
    dot: "#0365ac",
  },
  non_billable: {
    label: "Non-billable",
    color: "#393a3d",
    bg: "#eceef1",
    dot: "#9a9ca5",
  },
  review: {
    label: "Needs review",
    color: "#a16207",
    bg: "#fef9c3",
    dot: "#ca8a04",
  },
};

export function BillableBadge({
  status,
  size = "sm",
}: {
  status: BillableStatus;
  size?: "sm" | "md";
}) {
  const meta = BADGE_META[status];
  const sizeClass =
    size === "md"
      ? "rounded-md px-2.5 py-1 text-xs"
      : "rounded px-2 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold ${sizeClass}`}
      style={{ color: meta.color, backgroundColor: meta.bg }}
      title={meta.label}
    >
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: meta.dot }}
      />
      {meta.label}
    </span>
  );
}
