"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { NAV_INTEGRATION_LINKS, NAV_PRODUCT_LINKS } from "./constants";
import { LandingLogo } from "./LandingLogo";

function ChevronDown() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function NavDropdown({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="group relative flex items-stretch">
      <button
        type="button"
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--cb-muted)] transition hover:text-[var(--cb-dark)]"
      >
        {label}
        <ChevronDown />
      </button>
      <div
        className={`absolute left-0 top-full z-50 hidden rounded-xl border border-[var(--cb-border)] bg-white p-2 shadow-xl group-hover:block ${
          wide ? "w-[min(100vw-2rem,520px)]" : "min-w-[200px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { openSignIn } = useAuthModal();

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <LandingLogo />
          <div className="hidden items-center md:flex">
            <NavDropdown label="Product" wide>
              <div className="grid gap-1 sm:grid-cols-2">
                {NAV_PRODUCT_LINKS.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="rounded-lg px-3 py-2.5 transition hover:bg-[var(--cb-surface)]"
                  >
                    <div className="text-sm font-semibold text-[var(--cb-dark)]">{item.title}</div>
                    <div className="mt-0.5 text-xs text-[var(--cb-muted)]">{item.desc}</div>
                  </Link>
                ))}
              </div>
            </NavDropdown>
            <NavDropdown label="Integrations">
              {NAV_INTEGRATION_LINKS.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--cb-dark)] transition hover:bg-[var(--cb-surface)]"
                >
                  {item.title}
                </Link>
              ))}
            </NavDropdown>
            <Link
              href="/#features"
              className="px-3 py-2 text-sm font-medium text-[var(--cb-muted)] transition hover:text-[var(--cb-dark)]"
            >
              Features
            </Link>
            <Link
              href="/#pricing"
              className="px-3 py-2 text-sm font-medium text-[var(--cb-muted)] transition hover:text-[var(--cb-dark)]"
            >
              Pricing
            </Link>
            <Link
              href="/#faq"
              className="px-3 py-2 text-sm font-medium text-[var(--cb-muted)] transition hover:text-[var(--cb-dark)]"
            >
              FAQ
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={openSignIn}
            className="hidden text-sm font-medium text-[var(--cb-muted)] transition hover:text-[var(--cb-dark)] sm:inline"
          >
            Sign in
          </button>
          <Link href="/dashboard/scan" className="cb-btn-primary">
            Try Moodna
          </Link>
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            className="rounded-lg p-2 text-[var(--cb-muted)] md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="border-t border-[var(--cb-border)] bg-white px-4 py-4 md:hidden">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--cb-muted)]">
            Product
          </p>
          {NAV_PRODUCT_LINKS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="block rounded-lg py-2.5 text-sm font-medium text-[var(--cb-dark)]"
              onClick={() => setMobileOpen(false)}
            >
              {item.title}
            </Link>
          ))}
          <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-[var(--cb-muted)]">
            Integrations
          </p>
          {NAV_INTEGRATION_LINKS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="block rounded-lg py-2.5 text-sm font-medium text-[var(--cb-dark)]"
              onClick={() => setMobileOpen(false)}
            >
              {item.title}
            </Link>
          ))}
          <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wider text-[var(--cb-muted)]">
            Explore
          </p>
          <Link
            href="/#features"
            className="block rounded-lg py-2.5 text-sm font-medium text-[var(--cb-dark)]"
            onClick={() => setMobileOpen(false)}
          >
            Features
          </Link>
          <Link
            href="/#pricing"
            className="block rounded-lg py-2.5 text-sm font-medium text-[var(--cb-dark)]"
            onClick={() => setMobileOpen(false)}
          >
            Pricing
          </Link>
          <Link
            href="/#faq"
            className="block rounded-lg py-2.5 text-sm font-medium text-[var(--cb-dark)]"
            onClick={() => setMobileOpen(false)}
          >
            FAQ
          </Link>
          <button
            type="button"
            className="mt-4 block py-2.5 text-left text-sm font-medium text-[var(--cb-muted)]"
            onClick={() => {
              setMobileOpen(false);
              openSignIn();
            }}
          >
            Sign in
          </button>
          <Link
            href="/dashboard/scan"
            className="cb-btn-primary mt-3 w-full"
            onClick={() => setMobileOpen(false)}
          >
            Try Moodna
          </Link>
        </div>
      ) : null}
    </header>
  );
}
