"use client";

import Image from "next/image";
import { useState } from "react";
import { TESTIMONIALS, TWITTER_ICON } from "./constants";
import { LandingCustomersBanner } from "./LandingCustomersBanner";
import { LandingLogo } from "./LandingLogo";

function renderQuote(quote: string) {
  const parts = quote.split("@BetterStackHQ");
  return parts.map((part, index) => (
    <span key={index}>
      {part}
      {index < parts.length - 1 ? (
        <a
          href="https://twitter.com/betterstackhq"
          className="text-brand-primary-90"
          target="_blank"
          rel="nofollow noopener"
        >
          @BetterStackHQ
        </a>
      ) : null}
    </span>
  ));
}

export function LandingTestimonials() {
  const [showAll, setShowAll] = useState(false);

  return (
    <section className="container mx-auto -mb-32 pt-16 sm:mb-32 sm:pt-32">
      <div className="flex flex-col items-center px-4 text-center">
        <h4 className="heading-h4 logs-text text-[24px] leading-[108%] text-transparent lg:text-[36px]">
          Don&apos;t just take our word for it
        </h4>
        <p className="mt-4 max-w-[624px]">
          We&apos;re proud to be working with publicly traded companies as well as individual indie
          hackers and are thankful for their feedback, suggestions, and support.
        </p>
      </div>

      <LandingCustomersBanner />

      <div className="mt-10 columns-1 sm:columns-2 md:columns-3 lg:columns-4">
        {TESTIMONIALS.map((item) => (
          <article
            key={item.handle}
            className={`mx-auto mb-4 max-w-[320px] break-inside-avoid rounded-xl border border-qb-border bg-qb-surface p-5 shadow-sm ${
              "hiddenSm" in item && item.hiddenSm && !showAll ? "hidden sm:block" : ""
            }`}
          >
            <p className="leading-[145%]">{renderQuote(item.quote)}</p>
            <a
              href={item.href}
              className="-m-5 mt-5 flex items-start p-5"
              rel="nofollow noopener"
              target="_blank"
            >
              <Image
                src={item.avatar}
                alt=""
                width={37}
                height={37}
                className="mt-1 shrink-0 rounded-full"
              />
              <div className="mx-2 grow">
                <div className="font-bold text-[#363D4E]">{item.name}</div>
                <div className="text-base">{item.handle}</div>
              </div>
              <Image src={TWITTER_ICON} alt="" width={22} height={16} className="mt-4 shrink-0" />
            </a>
          </article>
        ))}
        {!showAll ? (
          <div className="relative z-10 -mt-16 mx-auto max-w-[320px] bg-qb-bg text-center text-qb-text sm:hidden">
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 top-[-400px] bg-linear-to-t from-[#eceef1]" />
            <button
              type="button"
              className="relative w-full border-t border-qb-border p-4 text-base"
              onClick={() => setShowAll(true)}
            >
              Show more ↓
            </button>
          </div>
        ) : null}
      </div>
      <div className="h-32" />
    </section>
  );
}

const SOLUTIONS = [
  ["AI SRE", "https://betterstack.com/ai-sre"],
  ["OpenTelemetry tracing", "https://betterstack.com/tracing"],
  ["Log management", "https://betterstack.com/telemetry"],
  ["Infrastructure monitoring", "https://betterstack.com/infrastructure-monitoring"],
  ["Error tracking", "https://betterstack.com/error-tracking"],
  ["Real user monitoring", "https://betterstack.com/real-user-monitoring"],
  ["Incident management", "https://betterstack.com/incident-management"],
  ["Uptime monitoring", "https://betterstack.com/uptime"],
  ["Status page", "https://betterstack.com/status-page"],
] as const;

const RESOURCES = [
  ["Help & Support", "https://betterstack.com/help"],
  ["Documentation", "https://betterstack.com/docs/"],
  ["Enterprise", "https://betterstack.com/enterprise"],
  ["Integrations", "https://betterstack.com/integrations"],
  ["Dashboards", "https://betterstack.com/dashboards"],
] as const;

const COMMUNITY_ARTICLES = [
  ["What Is Incident Management? Beginner's Guide", "https://betterstack.com/community/guides/incident-management/what-is-incident-management/"],
  ["Best Datadog Alternatives to Consider in 2026", "https://betterstack.com/community/comparisons/datadog-log-management-alternatives/"],
  ["8 Best Free & Open Source Status Page Tools in 2026", "https://betterstack.com/community/comparisons/free-status-page-tools/"],
  ["13 Best Sentry Alternatives in 2026", "https://betterstack.com/community/comparisons/sentry-alternatives/"],
  ["15 Best Grafana Alternatives in 2026", "https://betterstack.com/community/comparisons/grafana-alternatives/"],
  ["The 10 Best Incident.io Alternatives in 2026", "https://betterstack.com/community/comparisons/incident-io-alternative/"],
  ["5 Most Used Incident Management Tools", "https://betterstack.com/community/comparisons/incident-management-tools/"],
] as const;

export function LandingFooter() {
  return (
    <>
      <nav className="border-t border-qb-border bg-qb-surface text-base text-qb-text">
        <div className="mx-auto flex max-w-[1110px] px-5 pt-8 max-lg:pb-8 md:flex md:px-10 lg:pt-14">
          <div className="flex flex-2 grow gap-5">
            <div className="flex flex-1 flex-col lg:flex-2 lg:flex-row">
              <div className="lg:mr-12 lg:min-w-[200px] flex-1">
                <div className="mb-12">
                  <div className="font-medium text-[#363D4E]">Solutions</div>
                  {SOLUTIONS.map(([label, href]) => (
                    <a key={label} href={href} className="-mx-1 mt-3 inline-block px-1">
                      {label}
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <div className="mb-12 lg:hidden">
                  <div className="font-medium text-[#363D4E]">Company</div>
                  <a href="https://betterstack.com/careers" className="-mx-1 mt-3 inline-block px-1">
                    Work at Better Stack
                  </a>
                  <br />
                  <a href="https://betterstack.com/careers/engineering" className="-mx-1 mt-3 inline-block px-1">
                    Engineering
                  </a>
                  <br />
                  <a href="https://betterstack.com/security" className="-mx-1 mt-3 inline-block px-1">
                    Security
                  </a>
                </div>
                <div className="mb-12 hidden lg:block">
                  <div className="font-medium text-[#363D4E]">Resources</div>
                  {RESOURCES.map(([label, href]) => (
                    <span key={label}>
                      <a href={href} className="-mx-1 mt-3 inline-block whitespace-nowrap px-1">
                        {label}
                      </a>
                      <br />
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col lg:ml-12">
              <div className="mb-12 hidden lg:flex lg:min-w-[200px] flex-col items-start">
                <div className="font-medium text-[#363D4E]">Company</div>
                <a href="https://betterstack.com/careers" className="-mx-1 mt-3 inline-block px-1">
                  Work at Better Stack
                </a>
                <br />
                <a href="https://betterstack.com/careers/engineering" className="-mx-1 mt-3 inline-block px-1">
                  Engineering
                </a>
                <br />
                <a href="https://betterstack.com/security" className="-mx-1 mt-3 inline-block px-1">
                  Security
                </a>
              </div>
              <div className="mb-12 lg:hidden">
                <div className="font-medium text-[#363D4E]">Resources</div>
                {RESOURCES.map(([label, href]) => (
                  <span key={label}>
                    <a href={href} className="-mx-1 mt-3 inline-block whitespace-nowrap px-1">
                      {label}
                    </a>
                    <br />
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex max-w-[450px] flex-1 grow flex-col items-start md:ml-12">
            <div className="md:mb-12">
              <div className="font-medium text-[#363D4E]">Community</div>
              {COMMUNITY_ARTICLES.map(([label, href]) => (
                <a key={label} href={href} className="-mx-1 mt-4 block px-1">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <footer className="bg-[#f4f4ef]">
        <div className="mx-auto max-w-[1110px] text-base text-qb-text lg:px-5">
          <div className="flex flex-col items-center justify-between border-t border-neutral-300/10 px-5 pt-7 lg:flex-row lg:items-end lg:px-2 lg:mx-3">
            <div>
              <LandingLogo
                className="scale-75 text-[#363D4E] lg:scale-100"
                linkToHome={false}
              />
              <p className="mt-3 hidden max-w-[342px] lg:block">
                30x cheaper than Datadog. Predictable pricing. Exceptional customer support.
              </p>
            </div>
            <div className="flex items-center gap-6 whitespace-nowrap">
              <a className="-mx-1 hidden px-1 lg:block" href="tel:+1 (628) 900-3830">
                +1 (628) 900-3830
              </a>
              <a className="-mx-1 hidden px-1 lg:block" href="mailto:hello@betterstack.com">
                hello@betterstack.com
              </a>
            </div>
          </div>
          <div className="mt-5 flex flex-col items-center justify-between border-t border-neutral-300/10 px-5 py-3 text-[12px] leading-[18px] lg:flex-row lg:px-2 lg:mx-3">
            <div className="flex items-center gap-6 whitespace-nowrap text-[#646E87]">
              <a className="-mx-1 px-1" href="https://betterstack.com/terms">
                Terms of Use
              </a>
              <a className="-mx-1 px-1" href="https://betterstack.com/privacy">
                Privacy Policy
              </a>
              <a className="-mx-1 px-1" href="https://betterstack.com/dpa">
                GDPR
              </a>
              <a className="-mx-1 hidden px-1 sm:block" href="https://status.betterstack.com/" target="_blank">
                System status
              </a>
            </div>
            <div className="mt-8 mb-2 flex items-center text-[#646E87] lg:mt-0 lg:mb-0">
              © 2026 Better Stack, Inc.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
