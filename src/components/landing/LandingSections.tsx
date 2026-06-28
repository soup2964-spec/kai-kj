"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ANNOUNCEMENT,
  BENEFIT_CARDS,
  BLOG_POSTS,
  FEATURE_PILLS,
  HOW_IT_WORKS,
  INTEGRATIONS,
  PLATFORM_TABS,
} from "./constants";

export function LandingAnnouncement() {
  return (
    <div className="border-b border-blue-100 bg-[linear-gradient(90deg,#eef8ff,#ffffff,#eef8ff)] py-2.5 text-center text-sm text-[var(--cb-muted)]">
      <span className="font-medium text-[var(--cb-dark)]">{ANNOUNCEMENT.text}</span>{" "}
      <Link href={ANNOUNCEMENT.href} className="font-bold text-[var(--cb-primary)] hover:underline">
        {ANNOUNCEMENT.linkLabel} →
      </Link>
    </div>
  );
}

export function LandingBenefits() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-end gap-6 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--cb-primary)]">
              Expense control
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-[var(--cb-dark)] sm:text-5xl">
              Everything your receipts need after the photo.
            </h2>
          </div>
          <p className="text-lg leading-8 text-[var(--cb-muted)]">
            Kai KJ keeps the original receipt visible, extracts the bookkeeping
            details, and files every expense into folders that match how you work.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          {BENEFIT_CARDS.map((card, index) => (
            <article
              key={card.title}
              className={`group overflow-hidden rounded-[1.5rem] border border-[var(--cb-border)] bg-[var(--cb-surface)] p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl ${
                index === 0 ? "md:row-span-2 md:p-8" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-5">
                <div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-[var(--cb-primary)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-[var(--cb-dark)]">
                    {card.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-7 text-[var(--cb-muted)]">
                    {card.description}
                  </p>
                </div>
                <div className="shrink-0 rounded-2xl bg-white px-4 py-3 text-right shadow-sm ring-1 ring-[var(--cb-border)]">
                  <p className="text-2xl font-bold text-[var(--cb-primary)]">{card.stat}</p>
                  <p className="text-xs font-medium text-[var(--cb-muted)]">{card.statLabel}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingResults() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#071526_0%,#023e6b_52%,#0365ac_100%)] py-20 text-white sm:py-28">
      <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-blue-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">
              Built for speed
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              From messy receipts to clean expense reports.
            </h2>
            <p className="mt-5 text-lg leading-8 text-white/70">
              Scan once, review visually, and export structured data when the
              month closes or your accountant asks for support.
            </p>
            <ul className="mt-8 grid gap-3 text-white/85">
              {[
                "Purchase-date folders instead of upload-date clutter",
                "Card folders with nested monthly dropdowns",
                "Receipt images stay attached for later review",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-blue-100">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-white/10 p-6 ring-1 ring-white/15">
              <p className="text-5xl font-bold">90%</p>
              <p className="mt-3 text-sm leading-6 text-white/65">
                less manual data entry when receipts are scanned instead of typed.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white/10 p-6 ring-1 ring-white/15">
              <p className="text-5xl font-bold">2 min</p>
              <p className="mt-3 text-sm leading-6 text-white/65">
                to capture the first receipt and start organizing expenses.
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-white p-6 text-[var(--cb-dark)] shadow-2xl sm:col-span-2">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[var(--cb-primary)]">
                    Receipt readiness score
                  </p>
                  <p className="mt-1 text-2xl font-bold">91% ready to export</p>
                </div>
                <p className="text-3xl font-bold text-emerald-600">+38%</p>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[91%] rounded-full bg-gradient-to-r from-blue-400 to-[var(--cb-primary)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--cb-primary)]">
            Workflow
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-[var(--cb-dark)] sm:text-5xl">
            Three steps from receipt to report.
          </h2>
          <p className="mt-4 text-lg text-[var(--cb-muted)]">
            Simple enough for daily scans, structured enough for month-end review.
          </p>
        </div>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {HOW_IT_WORKS.map((step) => (
            <article
              key={step.title}
              className="rounded-[1.5rem] border border-[var(--cb-border)] bg-[var(--cb-surface)] p-6 shadow-sm"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--cb-dark)] text-sm font-bold text-white">
                {step.step}
              </div>
              <h3 className="mt-6 text-xl font-bold text-[var(--cb-dark)]">{step.title}</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--cb-muted)]">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPlatformShowcase() {
  const [activeTab, setActiveTab] = useState<(typeof PLATFORM_TABS)[number]["id"]>("dashboard");
  const active = PLATFORM_TABS.find((tab) => tab.id === activeTab) ?? PLATFORM_TABS[0];

  return (
    <section className="bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--cb-primary)]">
            Product tour
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-[var(--cb-dark)] sm:text-5xl">
            The workspace behind every receipt.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--cb-muted)]">
            Switch views to see how scans become organized, searchable,
            export-ready records.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2 rounded-full bg-white p-2 shadow-sm ring-1 ring-[var(--cb-border)]">
          {PLATFORM_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                activeTab === tab.id
                  ? "bg-[var(--cb-primary)] text-white shadow-sm"
                  : "text-[var(--cb-muted)] hover:bg-[var(--cb-surface)] hover:text-[var(--cb-dark)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <h3 className="text-3xl font-bold tracking-[-0.04em] text-[var(--cb-dark)]">
              {active.title}
            </h3>
            <p className="mt-4 text-lg leading-8 text-[var(--cb-muted)]">{active.description}</p>
            <Link href="/dashboard" className="cb-btn-primary mt-7 inline-flex h-12 px-6 text-base">
              Open dashboard
            </Link>
          </div>

          <div className="cb-mock-frame min-h-[360px] rounded-[1.75rem]">
            <div className="grid h-full gap-4 p-5 sm:grid-cols-[0.75fr_1.25fr]">
              <div className="rounded-2xl bg-white/7 p-4 ring-1 ring-white/10">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  {active.label}
                </p>
                <div className="mt-4 space-y-3">
                  {["Live Feed", "Cards", "Date", "Work order"].map((item, index) => (
                    <div
                      key={item}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                        index === 0 ? "bg-white text-[var(--cb-dark)]" : "bg-white/7 text-white/70"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 text-[var(--cb-dark)] shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--cb-muted)]">
                      {active.title}
                    </p>
                    <p className="mt-1 text-2xl font-bold">$4,218.40</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    synced
                  </span>
                </div>
                <div className="mt-5 space-y-3">
                  {[
                    ["Home Depot", "Jun 21", "$248.16"],
                    ["Lowe's", "Jun 18", "$94.22"],
                    ["Sherwin Williams", "Jun 14", "$186.40"],
                  ].map(([merchant, date, amount]) => (
                    <div key={merchant} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <div>
                        <p className="text-sm font-bold">{merchant}</p>
                        <p className="text-xs text-[var(--cb-muted)]">{date} · Visa ****4829</p>
                      </div>
                      <p className="text-sm font-bold">{amount}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingFeaturePills() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_PILLS.map((feature) => (
            <article
              key={feature.title}
              className="rounded-[1.25rem] border border-blue-100 bg-blue-50/50 p-5 text-center"
            >
              <h3 className="font-bold text-[var(--cb-dark)]">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--cb-muted)]">{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingIntegrations() {
  return (
    <section id="integrations" className="bg-[var(--cb-surface)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--cb-primary)]">
            Export paths
          </p>
          <h2 className="mt-3 text-4xl font-bold tracking-[-0.04em] text-[var(--cb-dark)] sm:text-5xl">
            Built around the tools you already use.
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--cb-muted)]">
            Keep expenses in Kai KJ, then export what your accountant or workflow needs.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {INTEGRATIONS.map((integration) => (
            <article
              key={integration.name}
              className="flex flex-col rounded-[1.5rem] border border-[var(--cb-border)] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-[var(--cb-primary)]">
                    {integration.name.slice(0, 2)}
                  </div>
                  <h3 className="text-xl font-bold text-[var(--cb-dark)]">{integration.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--cb-muted)]">{integration.description}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    integration.status === "Available"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {integration.status}
                </span>
              </div>
              <Link
                href={integration.href}
                className="cb-btn-secondary mt-5 inline-flex h-10 w-fit items-center px-4 text-sm"
              >
                {integration.status === "Available" ? "Add integration" : "Notify me"}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingBottomCta() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#023e6b,#0365ac)] px-6 py-14 text-center text-white shadow-2xl sm:px-12">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-100">
            Ready when receipts pile up
          </p>
          <h2 className="mx-auto mt-3 max-w-3xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
            Scan today. Close the books faster this month.
        </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-50/80">
            Bring every receipt, card folder, work order, and export into one clean workflow.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/dashboard/scan" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 text-base font-bold text-[var(--cb-primary)] transition hover:bg-blue-50">
              Start scanning
            </Link>
            <Link href="/dashboard/expenses" className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-6 text-base font-bold text-white transition hover:bg-white/10">
              See folders
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingBlog() {
  return (
    <section className="border-t border-[var(--cb-border)] bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--cb-primary)]">
              Resources
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] text-[var(--cb-dark)] sm:text-4xl">
              Expense workflow notes
            </h2>
            <p className="mt-2 text-[var(--cb-muted)]">
              Learn how to stay organized and export-ready.
            </p>
          </div>
          <Link href="/dashboard" className="text-sm font-semibold text-[var(--cb-primary)] hover:underline">
            View all →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {BLOG_POSTS.map((post) => (
            <article
              key={post.title}
              className="group rounded-[1.5rem] border border-[var(--cb-border)] bg-[var(--cb-surface)] p-6 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cb-muted)]">
                {post.category} · {post.date}
              </p>
              <h3 className="mt-3 text-lg font-semibold text-[var(--cb-dark)] group-hover:text-[var(--cb-primary)]">
                {post.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--cb-muted)]">{post.excerpt}</p>
              <p className="mt-4 text-xs text-[var(--cb-muted)]">{post.readMinutes} min read</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
