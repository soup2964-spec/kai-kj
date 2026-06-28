import Image from "next/image";
import Link from "next/link";
import { SITE_LOGO_ALT, SITE_LOGO_SVG } from "./constants";

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
    <span className={`inline-block h-[21px] w-[154px] ${className}`} aria-hidden />
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
