"use client";

import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { IconReceipt } from "@/components/icons";

export function DashboardSidebar() {
  return (
    <aside className="flex h-full w-full flex-col border-r border-qb-border bg-qb-surface">
      <div className="dashboard-top-bar dashboard-gutter bg-qb-blue-dark">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white/15">
            <IconReceipt className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">Moodna</p>
            <p className="text-[11px] text-white/70">Expense Tracker</p>
          </div>
        </div>
      </div>

      <DashboardNav variant="sidebar" />
    </aside>
  );
}
