import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#f8fbff_0%,#dff2ff_48%,#b9dcff_100%)] pb-16 pt-10 sm:pb-24 sm:pt-16">
      <div className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-white/60 blur-3xl" />
      <div className="pointer-events-none absolute -right-28 top-4 h-96 w-96 rounded-full bg-[var(--cb-primary)]/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white to-transparent" />

      <div className="relative mx-auto grid max-w-6xl items-start gap-12 px-4 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14">
        <div className="flex w-full min-w-0 max-w-xl flex-col items-start text-left">
          <div className="landing-hero-copy w-full">
            <h1 className="text-3xl font-bold leading-[1.1] tracking-normal text-[var(--cb-dark)] sm:text-4xl lg:text-[2.75rem]">
              <span className="block w-full text-left">
                The Expense Tracking Agent{" "}
                For <span className="text-[var(--cb-primary)]">Property</span>
              </span>
              <span className="block w-full text-left text-[var(--cb-primary)]">Managers</span>
            </h1>

            <p className="mt-6 block w-full text-left text-lg leading-8 text-[var(--cb-muted)] sm:text-xl">
              Moodna scans receipts, reconciles bills against credit card statements, and integrates with AppFolio, QuickBooks, and Google Sheets.
            </p>
          </div>

          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link href="/dashboard/scan" className="cb-btn-primary h-13 px-7 text-base shadow-lg shadow-[0_18px_36px_-20px_color-mix(in_srgb,var(--sf-primary)_45%,transparent)]">
              Try Moodna
            </Link>
            <Link href="/dashboard/expenses" className="cb-btn-secondary h-13 px-7 text-base">
              View expense folders
            </Link>
          </div>

          <div className="mt-8 grid w-full grid-cols-3 gap-3 sm:max-w-lg">
            {[
              ["2 min", "first scan"],
              ["5+", "folder views"],
              ["1 click", "export"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/70 bg-white/65 p-3 shadow-sm backdrop-blur">
                <p className="text-xl font-bold text-[var(--cb-dark)]">{value}</p>
                <p className="mt-1 text-xs font-medium text-[var(--cb-muted)]">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -right-5 -top-6 hidden rounded-2xl border border-white/70 bg-white/80 p-4 shadow-xl backdrop-blur sm:block">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--cb-muted)]">
              Work order
            </p>
            <p className="mt-1 text-2xl font-bold text-[var(--cb-dark)]">76-2234</p>
            <p className="text-xs text-emerald-600">attached to billable receipt</p>
          </div>

          <div className="cb-mock-frame overflow-hidden rounded-[1.75rem]">
            <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-5 py-4">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
              </div>
              <span className="ml-2 text-xs text-white/50">kai-kj.app/live-feed</span>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-[0.82fr_1.18fr]">
              <div className="space-y-4">
                <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white">
                    Live feed
                  </p>
                  <p className="mt-2 text-3xl font-bold text-white">$4,218.40</p>
                  <p className="mt-1 text-xs text-white/50">47 receipts scanned</p>
                </div>

                <div className="rounded-2xl bg-white p-3 text-[var(--cb-dark)] shadow-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--cb-muted)]">Receipt image</span>
                    <span className="rounded-full bg-[color-mix(in_srgb,var(--sf-primary)_12%,white)] px-2 py-0.5 text-[10px] font-bold text-[var(--cb-primary)]">
                      saved
                    </span>
                  </div>
                  <div className="rounded-xl border border-dashed border-[color-mix(in_srgb,var(--sf-primary)_24%,white)] bg-[color-mix(in_srgb,var(--sf-primary)_12%,white)]/60 p-4">
                    <div className="space-y-2 rounded-lg bg-white p-3 shadow-sm">
                      <div className="h-2 w-20 rounded bg-slate-200" />
                      <div className="h-2 w-28 rounded bg-slate-200" />
                      <div className="h-2 w-16 rounded bg-slate-200" />
                      <div className="mt-3 flex justify-between border-t border-slate-100 pt-3">
                        <span className="h-2 w-14 rounded bg-slate-200" />
                        <span className="h-2 w-10 rounded bg-[color-mix(in_srgb,var(--sf-primary)_50%,white)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white/70">Card folders</span>
                    <span className="rounded-full bg-[color-mix(in_srgb,var(--sf-primary)_25%,transparent)] px-2 py-0.5 text-[10px] font-bold text-white">
                      Live
                    </span>
                  </div>
                  {[
                    ["Visa ****4829", "$1,438.12", "3 months"],
                    ["Card ****1044", "$942.55", "2 months"],
                    ["Unknown card", "$128.90", "needs review"],
                  ].map(([card, amount, sub]) => (
                    <div key={card} className="mb-2 rounded-xl bg-white/7 p-3 ring-1 ring-white/10 last:mb-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{card}</p>
                        <p className="text-sm font-bold text-white">{amount}</p>
                      </div>
                      <p className="mt-1 text-xs text-white/45">{sub}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10">
                  <p className="text-xs font-semibold text-white/70">Ready to export</p>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {["Date", "Card", "WO"].map((item) => (
                      <div key={item} className="rounded-lg bg-white/8 py-2 text-xs font-bold text-white/80">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 -left-4 hidden rounded-2xl border border-[var(--cb-border)] bg-white p-4 shadow-xl sm:block">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--cb-muted)]">
              Receipt scanned
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--cb-dark)]">
              Merchant, amount, date, card
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
