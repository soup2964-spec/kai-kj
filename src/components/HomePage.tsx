"use client";

import { BulkUpload } from "@/components/BulkUpload";
import { AuthNav } from "@/components/AuthNav";
import { ExpenseList } from "@/components/ExpenseList";
import { InstallPrompt } from "@/components/InstallPrompt";
import { LiveDashboard } from "@/components/LiveDashboard";
import { MobileLiveFeed } from "@/components/MobileLiveFeed";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { SummaryBar } from "@/components/SummaryBar";
import { useExpenses } from "@/lib/expense-store";

const DESKTOP_CONTENT_CLASS = "mx-auto w-full max-w-3xl px-4 lg:px-8";

export function HomePage() {
  const { expenses, loaded, addExpense, removeExpense } = useExpenses();

  if (!loaded) {
    return (
      <div className="ios-shell flex min-h-dvh items-center justify-center">
        <span className="qb-spinner" />
      </div>
    );
  }

  return (
    <div className="ios-shell flex min-h-dvh flex-col lg:flex-row">
      {/* iPhone: horizontal live feed strip */}
      <MobileLiveFeed expenses={expenses} />

      {/* Desktop: full left sidebar */}
      <div className="hidden lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-72 lg:shrink-0 xl:w-80">
        <LiveDashboard expenses={expenses} />
      </div>

      {/* Main workspace — centered on desktop */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 w-full border-b border-qb-border bg-qb-surface/95 shadow-sm backdrop-blur-md lg:static lg:bg-qb-surface">
          <div
            className={`${DESKTOP_CONTENT_CLASS} flex items-center justify-between py-3 lg:py-3.5`}
          >
            <div>
              <h1 className="text-base font-bold text-qb-text lg:hidden">
                KKP
              </h1>
              <p className="hidden text-sm text-qb-text-secondary lg:block">
                Welcome back — scan and track your expenses
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded border border-qb-border bg-qb-bg px-2.5 py-1 text-xs font-semibold text-qb-text-secondary">
                Beta
              </span>
              <AuthNav variant="dashboard" />
            </div>
          </div>
        </header>

        <main
          className={`ios-main ${DESKTOP_CONTENT_CLASS} flex flex-col gap-4 py-4 lg:gap-5 lg:py-6`}
        >
          <ReceiptScanner
            onScanComplete={(result, thumbnailUrl) => {
              addExpense(result, thumbnailUrl);
            }}
          />
          <BulkUpload
            onScanComplete={(result, thumbnailUrl) => {
              addExpense(result, thumbnailUrl);
            }}
          />
          <InstallPrompt />
          <SummaryBar expenses={expenses} />
          <ExpenseList expenses={expenses} onRemove={removeExpense} />
        </main>
      </div>
    </div>
  );
}
