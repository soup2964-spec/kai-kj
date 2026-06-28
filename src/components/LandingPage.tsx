"use client";

import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import {
  LandingAnnouncement,
  LandingBenefits,
  LandingBlog,
  LandingBottomCta,
  LandingFeaturePills,
  LandingHowItWorks,
  LandingIntegrations,
  LandingPlatformShowcase,
  LandingResults,
} from "@/components/landing/LandingSections";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { landingFont } from "@/lib/landing-fonts";

export function LandingPage() {
  return (
    <AuthModalProvider>
      <div className={`landing-page min-h-dvh overflow-x-hidden ${landingFont.variable}`}>
        <LandingAnnouncement />
        <LandingHeader />
        <main>
          <LandingHero />
          <LandingBenefits />
          <LandingResults />
          <LandingHowItWorks />
          <LandingPlatformShowcase />
          <LandingFeaturePills />
          <LandingIntegrations />
          <LandingBottomCta />
          <LandingBlog />
        </main>
        <LandingFooter />
      </div>
    </AuthModalProvider>
  );
}
