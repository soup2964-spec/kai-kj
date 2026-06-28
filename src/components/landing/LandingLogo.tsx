import Image from "next/image";
import Link from "next/link";
import { SITE_LOGO_ALT, SITE_LOGO_SVG, SITE_NAME } from "./constants";

type LandingLogoProps = {
  className?: string;
  linkToHome?: boolean;
};

export function LandingLogo({ className = "", linkToHome = true }: LandingLogoProps) {
  const logo = SITE_LOGO_SVG ? (
    <Image
      src={SITE_LOGO_SVG}
      alt={SITE_LOGO_ALT}
      width={154}
      height={21}
      className={className}
      unoptimized={SITE_LOGO_SVG.startsWith("http")}
    />
  ) : (
    <span
      className={`inline-flex items-center gap-2 text-lg font-bold tracking-tight text-[var(--cb-dark)] ${className}`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--cb-primary)] text-xs font-bold text-white">
        M
      </span>
      {SITE_NAME}
    </span>
  );

  if (linkToHome) {
    return (
      <Link href="/" className="flex items-center py-3" aria-label="Go to homepage">
        {logo}
      </Link>
    );
  }

  return logo;
}
