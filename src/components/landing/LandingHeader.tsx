"use client";

import Image from "next/image";
import Link from "next/link";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { useState } from "react";
import { BETTER_STACK_LOGO_SVG } from "./constants";

const PLATFORM_LINKS = [
  { title: "AI SRE", desc: "Agentic root cause analysis", href: "https://betterstack.com/ai-sre" },
  { title: "Incident management & on-call", desc: "Move fast when things break", href: "https://betterstack.com/incident-management" },
  { title: "Status page", desc: "Communicate downtime & build trust", href: "https://betterstack.com/status-page" },
  { title: "Tracing", desc: "eBPF-based OpenTelemetry-native tracing", href: "https://betterstack.com/tracing" },
  { title: "Log management", desc: "Collect insights across your stack", href: "https://betterstack.com/log-management" },
  { title: "Infrastructure monitoring", desc: "OpenTelemetry-native infrastructure monitoring", href: "https://betterstack.com/infrastructure-monitoring" },
  { title: "Uptime monitoring", desc: "The most reliable uptime monitoring", href: "https://betterstack.com/uptime" },
  { title: "Real user monitoring", desc: "Session replay, web vitals & product analytics", href: "https://betterstack.com/real-user-monitoring" },
  { title: "Error tracking", desc: "AI‑native error tracking built on Better Stack", href: "https://betterstack.com/error-tracking" },
] as const;

const COMPANY_LINKS = [
  { label: "Work at Better Stack", href: "https://betterstack.com/careers" },
  { label: "Engineering", href: "https://betterstack.com/careers/engineering" },
  { label: "Security", href: "https://betterstack.com/security" },
  { label: "Blog", href: "https://betterstack.com/community/blog" },
  { label: "Changelog", href: "https://betterstack.com/tag/changelog" },
] as const;

const COMMUNITY_LINKS = [
  { label: "Guides", href: "https://betterstack.com/community/guides" },
  { label: "Questions", href: "https://betterstack.com/community/questions" },
  { label: "Comparisons", href: "https://betterstack.com/community/comparisons" },
] as const;

function ChevronDown() {
  return (
    <svg className="inline h-[11px] w-[11px]" viewBox="0 0 12 12" fill="currentColor" aria-hidden>
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function NavDropdown({
  label,
  children,
  className = "left-0",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="group relative flex items-stretch">
      <button type="button" className="relative flex items-center py-3 pl-3 pr-6 transition group-hover:text-white">
        {label}
        <span className="absolute right-2 text-[#656A7B]">
          <ChevronDown />
        </span>
      </button>
      <div
        className={`absolute top-full z-40 hidden min-w-[174px] rounded-lg border border-[#1F2433]/75 bg-[#181926]/80 p-[6px] backdrop-blur-2xl group-hover:block ${className}`}
        role="menu"
      >
        {children}
      </div>
    </div>
  );
}

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<"root" | "platform" | "community" | "company">("root");

  return (
    <header className="helvetica fixed left-0 right-0 top-0 z-40 flex justify-center bg-[#0B0C14]/80 before:absolute before:inset-0 before:-z-10 before:backdrop-blur-2xl">
      <nav className="mx-5 flex h-[52px] max-w-[1110px] grow items-stretch justify-between border-b border-[#727DA1]/15 text-[13px] leading-none text-[#C9D3EE]">
        <div className="flex items-stretch gap-3">
          <Link href="/" className="flex items-center py-3" aria-label="Go to homepage">
            <Image
              src={BETTER_STACK_LOGO_SVG}
              alt="Better Stack"
              width={154}
              height={21}
              className="-mx-6 scale-[65%]"
              unoptimized
            />
          </Link>
          <div className="hidden items-stretch gap-4 md:flex">
            <NavDropdown label="Platform" className="left-0 w-[667px] min-[1100px]:w-[950px] xl:w-[1005px]">
              <div className="grid w-full md:grid-cols-2 min-[1100px]:grid-cols-3">
                {PLATFORM_LINKS.map((item) => (
                  <a
                    key={item.title}
                    href={item.href}
                    className="block rounded px-2 py-[10px] leading-[145%] transition hover:bg-[#727DA1]/15"
                  >
                    <div className="font-medium">{item.title}</div>
                    <div className="mt-1 text-xs text-neutral-200">{item.desc}</div>
                  </a>
                ))}
              </div>
            </NavDropdown>
            <a className="hidden items-center p-3 transition hover:text-white lg:flex" href="https://betterstack.com/docs/">
              Documentation
            </a>
            <a className="hidden items-center p-3 transition hover:text-white lg:flex" href="https://betterstack.com/pricing">
              Pricing
            </a>
            <NavDropdown label="Community">
              {COMMUNITY_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block rounded-[6px] px-2 py-[6px] leading-[145%] transition hover:bg-[#727DA1]/15"
                >
                  {item.label}
                </a>
              ))}
            </NavDropdown>
            <NavDropdown label="Company">
              {COMPANY_LINKS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block rounded-[6px] px-2 py-[6px] leading-[145%] transition hover:bg-[#727DA1]/15"
                >
                  {item.label}
                </a>
              ))}
            </NavDropdown>
            <a className="hidden items-center p-3 transition hover:text-white lg:flex" href="https://betterstack.com/enterprise">
              Enterprise
            </a>
          </div>
        </div>

        <div className="-mr-3 flex items-center whitespace-nowrap sm:gap-2 md:mr-0">
          <SignInButton mode="redirect" forceRedirectUrl="/dashboard">
            <button type="button" className="p-2 transition hover:text-white">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton mode="redirect" forceRedirectUrl="/dashboard">
            <button
              type="button"
              className="cta-button flex h-[27px] items-center rounded bg-button-gradient px-2 font-medium text-white"
            >
              Sign up
            </button>
          </SignUpButton>
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="p-2 text-neutral-300 md:hidden"
            onClick={() => {
              setMobileOpen((open) => !open);
              setMobileSection("root");
            }}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileOpen ? (
          <div className="fixed left-0 right-0 top-[52px] z-40 max-h-[calc(100dvh-52px)] overflow-y-scroll bg-[#181926]/80 p-5 text-[#C9D3EE] backdrop-blur-2xl md:hidden">
            {mobileSection === "root" ? (
              <div className="flex flex-col gap-1">
                <button type="button" className="p-3 text-left" onClick={() => setMobileSection("platform")}>
                  Platform →
                </button>
                <a className="p-3" href="https://betterstack.com/docs/">
                  Documentation
                </a>
                <a className="p-3" href="https://betterstack.com/pricing">
                  Pricing
                </a>
                <button type="button" className="p-3 text-left" onClick={() => setMobileSection("community")}>
                  Community →
                </button>
                <button type="button" className="p-3 text-left" onClick={() => setMobileSection("company")}>
                  Company →
                </button>
                <a className="p-3" href="https://betterstack.com/enterprise">
                  Enterprise
                </a>
              </div>
            ) : null}
            {mobileSection === "platform" ? (
              <div>
                <button type="button" className="mb-2 p-3" onClick={() => setMobileSection("root")}>
                  ← Back
                </button>
                {PLATFORM_LINKS.map((item) => (
                  <a key={item.title} href={item.href} className="block p-3">
                    <div className="font-medium">{item.title}</div>
                    <div className="mt-1 text-xs text-neutral-200">{item.desc}</div>
                  </a>
                ))}
              </div>
            ) : null}
            {mobileSection === "community" ? (
              <div>
                <button type="button" className="mb-2 p-3" onClick={() => setMobileSection("root")}>
                  ← Back
                </button>
                {COMMUNITY_LINKS.map((item) => (
                  <a key={item.label} href={item.href} className="block p-3">
                    {item.label}
                  </a>
                ))}
              </div>
            ) : null}
            {mobileSection === "company" ? (
              <div className="pb-5">
                <button type="button" className="mb-2 p-3" onClick={() => setMobileSection("root")}>
                  ← Back
                </button>
                {COMPANY_LINKS.map((item) => (
                  <a key={item.label} href={item.href} className="block p-3">
                    {item.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </nav>
    </header>
  );
}
