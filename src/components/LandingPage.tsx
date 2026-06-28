import { LandingCarousel } from "@/components/landing/LandingCarousel";
import {
  LandingFooter,
  LandingTestimonials,
} from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import {
  LandingBottomCta,
  LandingCustomersMarquee,
  LandingPricingCompare,
} from "@/components/landing/LandingSections";
import { CAROUSEL_SECTIONS } from "@/components/landing/constants";
import { landingFont } from "@/lib/landing-fonts";

export function LandingPage() {
  return (
    <div
      className={`landing-page helvetica min-h-dvh overflow-x-hidden bg-[#0B0C14] text-neutral-200 ${landingFont.variable}`}
    >
      <LandingHeader />
      <div className="main overflow-x-hidden">
        <LandingHero />

        <div className="-mt-40 md:-mt-24">
          <LandingCustomersMarquee />
        </div>

        <hr className="border-separator-gradient container relative z-10 mx-auto mt-10 lg:mt-20" />

        <LandingPricingCompare />

        <hr className="border-separator-gradient container relative z-10 mx-auto mt-16 md:mt-32 max-sm:-mb-16" />

        {CAROUSEL_SECTIONS.map((section) => (
          <LandingCarousel key={section.title} section={section} />
        ))}

        <div className="container mx-auto mt-16 border-t border-separator-gradient md:mt-44" />

        <LandingBottomCta />

        <div className="container mx-auto border border-separator-gradient" />

        <LandingTestimonials />
      </div>

      <LandingFooter />
    </div>
  );
}
