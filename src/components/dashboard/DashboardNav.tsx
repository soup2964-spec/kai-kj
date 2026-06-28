"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DASHBOARD_NAV,
  isDashboardNavActive,
} from "@/components/dashboard/dashboard-nav";

type DashboardNavProps = {
  variant?: "sidebar" | "mobile";
};

export function DashboardNav({ variant = "sidebar" }: DashboardNavProps) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <nav
        aria-label="Dashboard sections"
        className="dashboard-gutter flex gap-2 overflow-x-auto border-b border-qb-border-light bg-qb-surface py-2 lg:hidden"
      >
        {DASHBOARD_NAV.map((item) => {
          const active = isDashboardNavActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`dashboard-nav-pill shrink-0 ${active ? "dashboard-nav-pill-active" : ""}`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Dashboard menu"
      className="border-b border-qb-border-light px-3 py-3"
    >
      <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-widest text-qb-text-muted">
        Menu
      </p>
      <ul className="space-y-0.5">
        {DASHBOARD_NAV.map((item) => {
          const active = isDashboardNavActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`dashboard-nav-link ${active ? "dashboard-nav-link-active" : ""}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
