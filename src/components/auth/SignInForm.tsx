"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getAccountEmail, isValidAccountEmail } from "@/lib/account-id";
import { signInWithEmail } from "@/lib/auth/client";

type SignInFormProps = {
  redirectTo?: string;
};

export function SignInForm({ redirectTo = "/dashboard" }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(() => getAccountEmail() ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isValidAccountEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await signInWithEmail(email, password);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      router.push(redirectTo);
    } finally {
      setSubmitting(false);
    }
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
            Sign in to your account
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
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            className="auth-modal-input"
          />
        </label>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button type="submit" disabled={submitting} className="cb-btn-primary h-11 w-full text-sm">
          {submitting ? "Please wait..." : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-[var(--cb-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/dashboard/scan"
          className="font-semibold text-[var(--cb-primary)] hover:underline"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
