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
    <div>
      <p className="text-sm font-semibold text-[var(--cb-dark)]">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link
              href={href}
              className="text-sm text-[var(--cb-muted)] transition hover:text-[var(--cb-dark)]"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-[var(--cb-border)] bg-[var(--cb-dark)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <LandingLogo linkToHome={false} className="text-white [&_span]:text-white" />
            <p className="mt-4 max-w-xs text-sm text-white/60">
              The leading way to scan receipts, organize expenses, and export on autopilot.
            </p>
          </div>
          <FooterColumn title="Solutions" links={FOOTER_COLUMNS.solutions} />
          <FooterColumn title="Resources" links={FOOTER_COLUMNS.resources} />
          <FooterColumn title="Company" links={FOOTER_COLUMNS.company} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/50">© {new Date().getFullYear()} Kai KJ. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-white/50">
            <Link href="/" className="hover:text-white">
              Terms
            </Link>
            <Link href="/" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/dashboard" className="hover:text-white">
              Status
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
