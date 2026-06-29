import {
  IconCamera,
  IconDashboard,
  IconExpenses,
  IconLiveFeed,
  IconSpark,
  IconStatement,
  IconSupport,
} from "@/components/icons";

export type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
  icon: typeof IconDashboard;
};

export const DASHBOARD_NAV: DashboardNavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    description: "Summary of your receipts and activity",
    icon: IconDashboard,
  },
  {
    href: "/dashboard/live-feed",
    label: "Live feed",
    description: "Track agent activity and pending expenses in real time",
    icon: IconLiveFeed,
  },
  {
    href: "/dashboard/scan",
    label: "Scan receipts",
    description: "Camera, upload, and bulk scan",
    icon: IconCamera,
  },
  {
    href: "/dashboard/agent",
    label: "Agent",
    description: "Connect integrations and enable the receipt agent",
    icon: IconSpark,
  },
  {
    href: "/dashboard/statements",
    label: "Upload statements",
    description: "Import credit card PDF or CSV statements",
    icon: IconStatement,
  },
  {
    href: "/dashboard/expenses",
    label: "Expenses",
    description: "All saved receipts",
    icon: IconExpenses,
  },
  {
    href: "/dashboard/support",
    label: "Support",
    description: "Submit complaints and view your support inbox",
    icon: IconSupport,
  },
];

export function getDashboardPageMeta(pathname: string) {
  const match =
    DASHBOARD_NAV.find((item) =>
      item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href),
    ) ?? DASHBOARD_NAV[0];

  return {
    title: match.label,
    description:
      match.href === "/dashboard"
        ? "Welcome back — choose a task to get started"
        : match.description,
  };
}

export function isDashboardNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname.startsWith(href);
}
