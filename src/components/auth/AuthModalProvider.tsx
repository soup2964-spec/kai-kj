"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getAccountEmail, isValidAccountEmail } from "@/lib/account-id";
import { signInWithEmail } from "@/lib/auth/client";

type AuthModalContextValue = {
  isOpen: boolean;
  openSignIn: () => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSignIn = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ isOpen, openSignIn, close }),
    [isOpen, openSignIn, close],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {isOpen ? <AuthModal onClose={close} /> : null}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
}

function AuthModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState(() => getAccountEmail() ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

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

      onClose();
      router.push("/dashboard");
    } finally {
      setSubmitting(false);
    }
  }

  function goToSignUp() {
    onClose();
    router.push("/dashboard/scan");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close sign in"
        className="absolute inset-0 bg-[var(--cb-dark)]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-[420px] rounded-2xl border border-[var(--cb-border)] bg-white p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[var(--cb-muted)] transition hover:bg-[var(--cb-surface)] hover:text-[var(--cb-dark)]"
        >
          ✕
        </button>

        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--cb-primary)] text-xs font-bold text-white">
            M
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cb-muted)]">
              Moodna
            </p>
            <h2 id="auth-modal-title" className="text-lg font-bold text-[var(--cb-dark)]">
              Sign in to your account
            </h2>
          </div>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[var(--cb-dark)]">
              Email
            </span>
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
            <span className="mb-1.5 block text-sm font-medium text-[var(--cb-dark)]">
              Password
            </span>
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
          <button
            type="button"
            className="font-semibold text-[var(--cb-primary)] hover:underline"
            onClick={goToSignUp}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
