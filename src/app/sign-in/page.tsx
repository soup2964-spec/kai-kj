"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { LandingLogo } from "@/components/landing/LandingLogo";
import { landingFont } from "@/lib/landing-fonts";

export default function SignInPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div
      className={`landing-page flex min-h-dvh flex-col bg-[var(--cb-surface,#f8fafc)] ${landingFont.variable}`}
    >
      <header className="border-b border-[var(--cb-border)] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <LandingLogo />
          <Link
            href="/"
            className="text-sm font-medium text-[var(--cb-muted)] transition hover:text-[var(--cb-dark)]"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-[420px] rounded-2xl border border-[var(--cb-border)] bg-white p-6 shadow-xl sm:p-8">
          <SignInForm mode="sign-in" />
        </div>
      </main>
    </div>
  );
}
