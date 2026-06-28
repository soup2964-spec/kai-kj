"use client";

import Link from "next/link";
import { useState } from "react";
import { ANNOUNCEMENT, FAQ_ITEMS, FEATURE_ROWS, PRICING_PLANS } from "./constants";

function ArrowIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function FeatureIcon({ type }: { type: (typeof FEATURE_ROWS)[number]["icon"] }) {
  const paths: Record<(typeof FEATURE_ROWS)[number]["icon"], string> = {
    scan: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    folders:
      "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
    review:
      "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    export:
      "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42",
  };

  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[type]} />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-[18px] w-[18px] shrink-0 text-[var(--sf-green)]" aria-hidden>
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  );
}

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

function FeatureVideoPlaceholder({ label }: { label: string }) {
  return (
    <div className="relative flex w-full max-w-lg items-center justify-center">
      <div className="relative aspect-video min-h-[200px] w-full overflow-hidden rounded-3xl border border-[var(--sf-border)] bg-[var(--sf-neutral-100)]/60 shadow-[var(--sf-shadow-sm)]">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--sf-primary-light)] text-[var(--sf-primary)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 translate-x-0.5" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--sf-dark)]">{label}</p>
            <p className="mt-1 text-xs text-[var(--sf-muted)]">Video demo coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureRow({
  feature,
}: {
  feature: (typeof FEATURE_ROWS)[number];
}) {
  const content = (
    <div className="flex-1 max-w-xl">
      <div className="mb-4 flex items-center gap-2 lg:mb-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--sf-primary)]/10 text-[var(--sf-primary)]">
          <FeatureIcon type={feature.icon} />
        </div>
        <span className="text-sm font-semibold uppercase tracking-wide text-[var(--sf-primary)]">
          {feature.label}
        </span>
      </div>
      <h2 className="mb-4 text-3xl font-bold text-[var(--sf-dark)] lg:mb-6 lg:text-5xl">
        {feature.title}{" "}
        <span className="text-[var(--sf-primary)]">{feature.highlight}</span>
      </h2>
      <p className="mb-6 text-base leading-relaxed text-[var(--sf-muted)] lg:mb-8 lg:text-lg">
        {feature.description}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href={feature.primaryCta.href} className="sf-btn-primary">
          {feature.primaryCta.label}
          <ArrowIcon />
        </Link>
        <Link href={feature.secondaryCta.href} className="sf-btn-secondary">
          {feature.secondaryCta.label}
        </Link>
      </div>
    </div>
  );

  const media = <FeatureVideoPlaceholder label={feature.videoLabel} />;

  return (
    <div className={`flex flex-col items-center gap-8 lg:gap-16 ${feature.reverse ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
      {content}
      <div className="flex w-full flex-1 items-center justify-center">{media}</div>
    </div>
  );
}

export function LandingFeatures() {
  return (
    <section id="features" className="bg-white">
      <div className="mx-auto max-w-7xl">
        {FEATURE_ROWS.map((feature, index) => (
          <div key={feature.id} className="py-8 lg:py-12">
            <div className="container mx-auto px-4">
              <FeatureRow feature={feature} />
            </div>
            {index < FEATURE_ROWS.length - 1 ? (
              <div className="mx-auto mt-8 h-px max-w-7xl bg-[var(--sf-neutral-100)] lg:mt-12" />
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

export function LandingFounderStory() {
  return (
    <section id="story" className="bg-white py-16">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-3xl border-2 border-[var(--sf-primary)]/50 bg-gradient-to-br from-[var(--sf-neutral-100)]/20 via-[var(--sf-neutral-100)]/30 to-[var(--sf-neutral-100)]/40 p-8 md:p-12">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-[var(--sf-primary)]/20 bg-[var(--sf-primary-light)] text-2xl font-bold text-[var(--sf-primary)] md:h-32 md:w-32">
              KJ
            </div>
            <div className="max-w-2xl">
              <h2 className="mb-2 text-2xl font-bold text-[var(--sf-dark)] md:text-3xl">
                Built for receipt-heavy teams
              </h2>
              <div className="space-y-4 text-left text-lg leading-relaxed text-[var(--sf-muted)] md:text-xl">
                <p>
                  Kai KJ started as a faster way to stop retyping receipts into
                  spreadsheets at month-end.
                </p>
                <p>
                  We wanted purchase dates, card folders, saved images, and
                  export-ready rows in one place — without juggling inboxes,
                  camera rolls, and manual logs.
                </p>
                <p>
                  Today Kai KJ helps you scan, organize, review, and export
                  expenses with the receipt image still attached when accounting
                  asks for proof.
                </p>
                <div className="flex justify-center pt-2">
                  <Link href="/dashboard/scan" className="sf-btn-primary mt-4 px-8">
                    Try it now
                    <ArrowIcon />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="overflow-hidden bg-[var(--sf-neutral-100)]/30 py-24">
      <div className="mx-auto max-w-7xl px-8">
        <div className="mb-6 flex w-full flex-col text-center">
          <p className="mb-8 font-medium text-[var(--sf-primary)]">Pricing</p>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--sf-dark)] lg:text-5xl">
            Simple plans for every receipt workflow.
          </h2>
          <div className="mt-20">
            <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <div className="flex w-64 rounded-full border border-[var(--sf-neutral-200)] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setYearly(false)}
                  className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                    !yearly
                      ? "bg-[var(--sf-primary)] text-white"
                      : "text-[var(--sf-muted)] hover:text-[var(--sf-dark)]"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setYearly(true)}
                  className={`relative flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                    yearly
                      ? "bg-[var(--sf-primary)] text-white"
                      : "text-[var(--sf-muted)] hover:text-[var(--sf-dark)]"
                  }`}
                >
                  Yearly
                  <span className="absolute -right-3 -top-3 whitespace-nowrap rounded-full bg-[var(--sf-yellow)] px-1 py-0.5 text-[10px] font-bold text-[var(--sf-dark)]">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex flex-col justify-center gap-8 md:flex-row">
          {PRICING_PLANS.map((plan) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
            const isFree = price === "Free";

            return (
              <div key={plan.name} className="relative w-full max-w-lg">
                <div
                  className={`relative z-10 flex h-full flex-col gap-5 rounded-lg bg-white p-8 lg:gap-8 ${
                    plan.featured
                      ? "border-2 border-[var(--sf-primary)] shadow-[var(--sf-shadow-md)]"
                      : "border border-[var(--sf-neutral-200)] shadow-[var(--sf-shadow-sm)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-lg font-bold text-[var(--sf-dark)] lg:text-xl">
                        {plan.name}
                        <span className="ml-1.5 inline-block rounded-xl bg-[var(--sf-primary)] px-2 py-1 text-xs font-semibold text-white">
                          {plan.badge}
                        </span>
                      </p>
                      <p className="mt-2 text-[var(--sf-muted)]">{plan.description}</p>
                    </div>
                  </div>

                  <div className="flex items-end gap-1">
                    <p className="text-5xl font-extrabold tracking-tight text-[var(--sf-dark)]">
                      {price}
                    </p>
                    {!isFree ? (
                      <p className="mb-0.5 text-lg font-normal lowercase text-[var(--sf-muted)]">
                        /month
                      </p>
                    ) : null}
                  </div>

                  <ul className="flex-1 space-y-2.5 text-base leading-relaxed">
                    {plan.features.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckIcon />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.href} className="sf-btn-primary w-full justify-center">
                    {plan.featured ? "Try for free" : "Join waitlist"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function LandingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-12 px-8 py-24 md:flex-row">
        <div className="basis-1/2 text-left">
          <p className="mb-4 inline-block font-semibold text-[var(--sf-primary)]">FAQ</p>
          <p className="text-3xl font-extrabold text-[var(--sf-dark)] sm:text-4xl">
            Frequently Asked Questions
          </p>
        </div>

        <ul className="basis-1/2">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <li key={item.question}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="relative flex w-full items-center gap-2 border-t border-[var(--sf-neutral-100)] py-5 text-left text-base font-semibold text-[var(--sf-dark)] md:text-lg"
                >
                  <span className="flex-1">{item.question}</span>
                  <svg
                    className={`ml-auto h-4 w-4 shrink-0 fill-current text-[var(--sf-muted)] transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
                    viewBox="0 0 16 16"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <rect y="7" width="16" height="2" rx="1" />
                    <rect y="7" width="16" height="2" rx="1" transform="rotate(90 8 8)" />
                  </svg>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isOpen ? "400px" : "0px",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="pb-5 leading-relaxed text-[var(--sf-muted)]">
                    <p>{item.answer}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function LandingBottomCta() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-3xl bg-gradient-to-br from-[var(--sf-neutral-100)]/70 via-[var(--sf-primary)]/5 to-[var(--sf-neutral-100)]/70 p-12 md:p-16">
          <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-[var(--sf-dark)] md:text-5xl">
              Ready to get <span className="text-[var(--sf-primary)]">started</span>?
            </h2>
            <p className="mb-8 text-lg text-[var(--sf-muted)]">
              Scan your first receipt and see card folders, saved images, and export-ready data in minutes.
            </p>
            <Link href="/dashboard/scan" className="sf-btn-primary min-w-[200px] justify-center px-8">
              Try it now
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
