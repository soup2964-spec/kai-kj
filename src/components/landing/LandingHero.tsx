import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-white pb-16 pt-12 sm:pb-24 sm:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(3,101,172,0.14),transparent)]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="flex max-w-xl flex-col items-start text-left">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-[var(--cb-dark)] sm:text-5xl lg:text-[3.25rem]">
            Your Expense
            <br />
            Tracking Agent
          </h1>

          <p className="mt-5 text-lg leading-relaxed text-[var(--cb-muted)]">
            Faster than an accountant, Smart categorization, one-click exports.
          </p>

          <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/dashboard" className="cb-btn-primary h-12 px-6 text-base">
              Get started today
            </Link>
            <Link href="/dashboard/scan" className="cb-btn-secondary h-12 px-6 text-base">
              Try the scanner
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="cb-mock-frame">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
              </div>
              <span className="ml-2 text-xs text-white/50">kai-kj.app/dashboard</span>
            </div>

            <div className="grid gap-3 p-4 sm:grid-cols-2">
              <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                  This month
                </p>
                <p className="mt-2 text-2xl font-bold text-white">$4,218.40</p>
                <p className="mt-1 text-xs text-emerald-400">↓ 12% vs last month</p>
              </div>
              <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="text-xs font-medium uppercase tracking-wider text-white/50">
                  Receipts scanned
                </p>
                <p className="mt-2 text-2xl font-bold text-white">47</p>
                <p className="mt-1 text-xs text-white/50">3 pending approval</p>
              </div>
            </div>

            <div className="mx-4 mb-4 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-white/70">Recent receipts</span>
                <span className="rounded-full bg-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-200">
                  Live
                </span>
              </div>
              {[
                ["Whole Foods", "$84.32", "Groceries"],
                ["Uber", "$24.50", "Travel"],
                ["AWS", "$142.00", "Software"],
              ].map(([merchant, amount, category]) => (
                <div
                  key={merchant}
                  className="flex items-center justify-between border-t border-white/5 py-2.5 first:border-0 first:pt-0"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{merchant}</p>
                    <p className="text-xs text-white/40">{category}</p>
                  </div>
                  <span className="text-sm font-semibold text-white">{amount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="absolute -bottom-4 -left-4 hidden rounded-xl border border-[var(--cb-border)] bg-white p-3 shadow-lg sm:block">
            <p className="text-xs font-semibold text-[var(--cb-dark)]">Receipt scanned</p>
            <p className="text-xs text-[var(--cb-muted)]">Merchant · amount · date extracted</p>
          </div>
        </div>
      </div>
    </section>
  );
}
