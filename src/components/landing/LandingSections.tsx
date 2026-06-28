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
    <div className="border-b border-[var(--cb-border)] bg-[var(--cb-surface)] py-2.5 text-center text-sm text-[var(--cb-muted)]">
      {ANNOUNCEMENT.text}{" "}
      <Link href={ANNOUNCEMENT.href} className="font-semibold text-[var(--cb-primary)] hover:underline">
        {ANNOUNCEMENT.linkLabel} →
      </Link>
    </div>
  );
}

export function LandingBenefits() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--cb-dark)] sm:text-4xl">
            Organize your expenses
          </h2>
          <p className="mt-4 text-lg text-[var(--cb-muted)]">
            From receipt photo to export-ready data — Kai KJ handles the busywork so
            you stay audit-ready without the spreadsheet grind.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {BENEFIT_CARDS.map((card) => (
            <article
              key={card.title}
              className="rounded-2xl border border-[var(--cb-border)] bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--cb-dark)]">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--cb-muted)]">
                    {card.description}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-bold text-[var(--cb-primary)]">{card.stat}</p>
                  <p className="text-xs text-[var(--cb-muted)]">{card.statLabel}</p>
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
    <section className="bg-[var(--cb-dark)] py-20 text-white sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              We deliver instant results
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Once connected, you&apos;ll see receipts organized immediately — most users
              cut manual entry time by over 90%.
            </p>
            <ul className="mt-8 space-y-4">
              {[
                "Decrease your manual data entry",
                "Quick and easy setup — no devs needed",
                "Just scan, review, and export",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-white/80">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--cb-primary)] text-xs">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <p className="text-4xl font-bold text-white">90%</p>
              <p className="mt-2 text-sm text-white/60">less manual entry on average</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <p className="text-4xl font-bold text-white">2 min</p>
              <p className="mt-2 text-sm text-white/60">to scan your first receipt</p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10 sm:col-span-2">
              <p className="text-sm font-medium text-white/50">Receipts organized automatically</p>
              <p className="mt-2 text-2xl font-bold">Cut manual entry by 91%</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
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
    <section id="how-it-works" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--cb-dark)] sm:text-4xl">
            How it works
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {HOW_IT_WORKS.map((step, index) => (
            <article key={step.title} className="relative text-center md:text-left">
              {index < HOW_IT_WORKS.length - 1 ? (
                <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-px w-[calc(100%-4rem)] bg-[var(--cb-border)] md:block" />
              ) : null}
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--cb-primary)] text-lg font-bold text-white md:mx-0">
                {step.step}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-[var(--cb-dark)]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--cb-muted)]">
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
    <section className="bg-[var(--cb-surface)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--cb-dark)] sm:text-4xl">
            Our platform in action
          </h2>
          <p className="mt-4 text-lg text-[var(--cb-muted)]">
            Explore Kai KJ&apos;s receipt tools and expense workflows.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {PLATFORM_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-[var(--cb-dark)] text-white"
                  : "bg-white text-[var(--cb-muted)] ring-1 ring-[var(--cb-border)] hover:text-[var(--cb-dark)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-10 grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h3 className="text-2xl font-bold text-[var(--cb-dark)]">{active.title}</h3>
            <p className="mt-3 text-[var(--cb-muted)]">{active.description}</p>
            <Link href="/dashboard" className="cb-btn-primary mt-6 inline-flex h-11 px-5 text-sm">
              Open dashboard
            </Link>
          </div>

          <div className="cb-mock-frame min-h-[280px]">
            <div className="flex h-full flex-col justify-center p-6">
              <div className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
                  {active.label}
                </p>
                <p className="mt-3 text-lg font-semibold text-white">{active.title}</p>
                <div className="mt-4 space-y-2">
                  {[1, 2, 3].map((row) => (
                    <div key={row} className="h-2 rounded-full bg-white/10" style={{ width: `${100 - row * 12}%` }} />
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
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_PILLS.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-[var(--cb-border)] bg-white p-5 text-center shadow-sm"
            >
              <h3 className="font-semibold text-[var(--cb-dark)]">{feature.title}</h3>
              <p className="mt-2 text-sm text-[var(--cb-muted)]">{feature.description}</p>
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
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--cb-dark)] sm:text-4xl">
            Integrations
          </h2>
          <p className="mt-4 text-lg text-[var(--cb-muted)]">
            Kai KJ connects with the tools you already use for exports and storage.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {INTEGRATIONS.map((integration) => (
            <article
              key={integration.name}
              className="flex flex-col rounded-2xl border border-[var(--cb-border)] bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--cb-dark)]">{integration.name}</h3>
                  <p className="mt-2 text-sm text-[var(--cb-muted)]">{integration.description}</p>
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
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--cb-dark)] sm:text-4xl">
          Get organized today
        </h2>
        <p className="mt-4 text-lg text-[var(--cb-muted)]">
          We take care of receipt data entry, so you can focus on running your business
          stress-free.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="cb-btn-primary h-12 px-6 text-base">
            Get started today
          </Link>
          <Link href="/dashboard/scan" className="cb-btn-secondary h-12 px-6 text-base">
            Scan a receipt
          </Link>
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
            <h2 className="text-3xl font-bold tracking-tight text-[var(--cb-dark)]">
              Guides & tips
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
              className="group rounded-2xl border border-[var(--cb-border)] bg-[var(--cb-surface)] p-6 transition hover:shadow-md"
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
