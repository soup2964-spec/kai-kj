import Link from "next/link";
import { FOOTER_COLUMNS } from "./constants";
import { LandingLogo } from "./LandingLogo";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly (readonly [string, string])[];
}) {
  return (
    <div className="lg:w-1/4 md:w-1/2 w-full px-4">
      <p className="footer-title mb-3 text-sm font-semibold uppercase tracking-widest text-[var(--sf-dark)] md:text-left">
        {title}
      </p>
      <div className="mb-10 flex flex-col items-center justify-center gap-2 text-sm md:items-start">
        {links.map(([label, href]) => (
          <Link
            key={label}
            href={href}
            className="text-[var(--sf-muted)] transition hover:text-[var(--sf-primary)]"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="landing-body relative border-t border-[var(--sf-neutral-100)] bg-gradient-to-b from-[var(--sf-neutral-100)]/90 to-[var(--sf-neutral-100)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--sf-neutral-200)] to-transparent"
        aria-hidden
      />
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="flex flex-col flex-wrap md:flex-row md:flex-nowrap lg:items-start">
          <div className="mx-auto w-64 shrink-0 text-center md:mx-0 md:text-left">
            <LandingLogo linkToHome={false} />
            <p className="mt-3 text-sm text-[var(--sf-muted)]">
              Kai KJ turns receipt photos into organized expenses with card folders,
              saved images, and export-ready data.
            </p>
            <p className="mt-3 text-sm text-[var(--sf-neutral-400)]">
              Copyright © {new Date().getFullYear()} — All rights reserved
            </p>
          </div>

          <div className="-mb-10 mt-10 flex flex-grow flex-wrap justify-center text-center md:mt-0">
            <FooterColumn title="Links" links={FOOTER_COLUMNS.links} />
            <FooterColumn title="Product" links={FOOTER_COLUMNS.product} />
          </div>
        </div>
      </div>
    </footer>
  );
}
