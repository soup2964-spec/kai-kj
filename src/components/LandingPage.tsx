"use client";

import { AuthModalProvider } from "@/components/auth/AuthModalProvider";
import {
  LandingAnnouncement,
  LandingBottomCta,
  LandingFaq,
  LandingFeatures,
  LandingFounderStory,
  LandingPricing,
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
          <div className="landing-body">
            <LandingFeatures />
            <LandingFounderStory />
            <LandingPricing />
            <LandingFaq />
            <LandingBottomCta />
          </div>
        </main>
        <LandingFooter />
      </div>
    </AuthModalProvider>
  );
}
