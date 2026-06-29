"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignIn, useSignUp } from "@clerk/nextjs";
import { useState } from "react";

type SignInFormProps = {
  redirectTo?: string;
  mode?: "sign-in" | "sign-up";
};

function clerkErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const clerkError = error as {
      code: string;
      longMessage?: string;
      message?: string;
    };
    return clerkError.longMessage ?? clerkError.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function clerkErrorCode(error: unknown): string | null {
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return null;
}

export function SignInForm({
  redirectTo = "/dashboard",
  mode = "sign-in",
}: SignInFormProps) {
  const router = useRouter();
  const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showEmailCode, setShowEmailCode] = useState(false);
  const [needsClientTrust, setNeedsClientTrust] = useState(false);
  const submitting =
    signInFetchStatus === "fetching" || signUpFetchStatus === "fetching";

  async function finalizeSignIn() {
    if (!signIn || signIn.status !== "complete") return;

    await signIn.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          return;
        }

        const url = decorateUrl(redirectTo);
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  }

  async function finalizeSignUp() {
    if (!signUp || signUp.status !== "complete") return;

    await signUp.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          return;
        }

        const url = decorateUrl(redirectTo);
        if (url.startsWith("http")) {
          window.location.href = url;
        } else {
          router.push(url);
        }
      },
    });
  }

  async function handleSignUp() {
    if (!signUp) return;

    const { error: createError } = await signUp.password({
      emailAddress: email,
      password,
    });

    if (createError) {
      setError(clerkErrorMessage(createError, "Could not create account."));
      return;
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setError(clerkErrorMessage(sendError, "Could not send verification code."));
      return;
    }

    setShowEmailCode(true);
  }

  async function handleSignIn() {
    if (!signIn) return;

    const { error: signInError } = await signIn.password({
      emailAddress: email,
      password,
    });

    if (signInError) {
      const firstCode = clerkErrorCode(signInError);

      if (mode === "sign-in" && firstCode === "form_identifier_not_found") {
        setError("No account found for that email. Create an account instead.");
        return;
      }

      if (mode === "sign-up" && firstCode === "form_identifier_exists") {
        setError("An account already exists for that email. Sign in instead.");
        return;
      }

      setError(clerkErrorMessage(signInError, "Could not sign in."));
      return;
    }

    if (signIn.status === "complete") {
      await finalizeSignIn();
      return;
    }

    if (signIn.status === "needs_client_trust") {
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === "email_code",
      );

      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
        setNeedsClientTrust(true);
        return;
      }
    }

    setError("Sign in could not be completed. Try again.");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password.");
      return;
    }

    try {
      if (mode === "sign-up") {
        await handleSignUp();
      } else {
        await handleSignIn();
      }
    } catch (submitError) {
      setError(clerkErrorMessage(submitError, "Authentication failed."));
    }
  }

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("Enter the verification code from your email.");
      return;
    }

    try {
      if (showEmailCode) {
        const { error: verifyError } = await signUp?.verifications.verifyEmailCode({
          code,
        });

        if (verifyError) {
          setError(clerkErrorMessage(verifyError, "Invalid verification code."));
          return;
        }

        if (signUp?.status === "complete") {
          await finalizeSignUp();
        } else {
          setError("Account verification is not complete yet.");
        }
        return;
      }

      const { error: verifyError } = await signIn?.mfa.verifyEmailCode({ code });
      if (verifyError) {
        setError(clerkErrorMessage(verifyError, "Invalid verification code."));
        return;
      }

      if (signIn?.status === "complete") {
        await finalizeSignIn();
      } else {
        setError("Verification is not complete yet.");
      }
    } catch (verifySubmitError) {
      setError(clerkErrorMessage(verifySubmitError, "Verification failed."));
    }
  }

  if (showEmailCode || needsClientTrust) {
    return (
      <>
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--cb-primary)] text-xs font-bold text-white">
            M
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cb-muted)]">
              Moodna
            </p>
            <h1 id="sign-in-title" className="text-lg font-bold text-[var(--cb-dark)]">
              Verify your email
            </h1>
          </div>
        </div>

        <p className="mb-4 text-sm text-[var(--cb-muted)]">
          We sent a verification code to <strong>{email}</strong>.
        </p>

        <form onSubmit={(event) => void handleVerify(event)} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--cb-dark)]">
              Verification code
            </span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="123456"
              className="auth-modal-input"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="cb-btn-primary h-11 w-full text-sm"
          >
            {submitting ? "Please wait..." : "Verify and continue"}
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--cb-primary)] text-xs font-bold text-white">
          M
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cb-muted)]">
            Moodna
          </p>
          <h1 id="sign-in-title" className="text-lg font-bold text-[var(--cb-dark)]">
            {mode === "sign-up" ? "Create your account" : "Sign in to your account"}
          </h1>
        </div>
      </div>

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--cb-dark)]">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="auth-modal-input"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[var(--cb-dark)]">Password</span>
          <input
            type="password"
            autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "sign-up" ? "Create a password" : "Enter your password"}
            className="auth-modal-input"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button type="submit" disabled={submitting} className="cb-btn-primary h-11 w-full text-sm">
          {submitting
            ? "Please wait..."
            : mode === "sign-up"
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[var(--cb-muted)]">
        {mode === "sign-up" ? (
          <>
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-semibold text-[var(--cb-primary)] hover:underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="font-semibold text-[var(--cb-primary)] hover:underline"
            >
              Sign up
            </Link>
          </>
        )}
      </p>
    </>
  );
}
