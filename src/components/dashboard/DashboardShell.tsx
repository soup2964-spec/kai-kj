"use client";

import { AuthNav } from "@/components/AuthNav";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { getDashboardPageMeta } from "@/components/dashboard/dashboard-nav";
import { useExpenseContext } from "@/lib/expense-context";
import { usePathname } from "next/navigation";

const MAIN_CONTENT_CLASS = "dashboard-gutter mx-auto w-full max-w-3xl";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { loaded, syncError } = useExpenseContext();
  const { title, description } = getDashboardPageMeta(pathname);

  if (!loaded) {
    return (
      <div className="ios-shell flex min-h-dvh items-center justify-center">
        <span className="qb-spinner" />
      </div>
    );
  }

  return (
    <div className="ios-shell flex min-h-dvh flex-col lg:flex-row">
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-72 lg:shrink-0 xl:w-80">
        <DashboardSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 w-full border-b border-qb-border bg-qb-surface shadow-sm backdrop-blur-md lg:static lg:bg-qb-surface">
          <div className="dashboard-top-bar dashboard-gutter w-full justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-qb-text">
                {title}
              </h1>
              <p className="hidden truncate text-sm text-qb-text-secondary lg:block">
                {description}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="rounded border border-qb-border bg-qb-bg px-2.5 py-1 text-xs font-semibold text-qb-text-secondary">
                Beta
              </span>
              <AuthNav variant="dashboard" />
            </div>
          </div>
          <DashboardNav variant="mobile" />
        </header>

        <main
          className={`ios-main ${MAIN_CONTENT_CLASS} flex flex-col gap-4 py-4 lg:gap-5 lg:py-6`}
        >
          {syncError ? (
            <div className="rounded-lg border border-qb-danger/30 bg-qb-danger-bg px-4 py-3 text-sm text-qb-danger">
              {syncError}
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}
