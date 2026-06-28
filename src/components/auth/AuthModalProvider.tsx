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
import {
  signInWithEmail,
  signInWithOAuth,
  signUpWithEmail,
  type AuthMode,
} from "@/lib/auth/client";

type AuthModalContextValue = {
  isOpen: boolean;
  mode: AuthMode;
  openSignIn: () => void;
  openSignUp: () => void;
  close: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("sign-in");

  const openSignIn = useCallback(() => {
    setMode("sign-in");
    setIsOpen(true);
  }, []);

  const openSignUp = useCallback(() => {
    setMode("sign-up");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(
    () => ({ isOpen, mode, openSignIn, openSignUp, close }),
    [isOpen, mode, openSignIn, openSignUp, close],
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {isOpen ? <AuthModal mode={mode} onClose={close} onModeChange={setMode} /> : null}
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

function AuthModal({
  mode,
  onClose,
  onModeChange,
}: {
  mode: AuthMode;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(() => getAccountEmail() ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<string | null>(null);

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
      const result =
        mode === "sign-in"
          ? await signInWithEmail(email, password)
          : await signUpWithEmail(email, password);

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

  async function handleOAuth(provider: "google" | "apple") {
    setError(null);
    setOauthBusy(provider);
    try {
      const result = await signInWithOAuth(provider);
      if (!result.ok) {
        setError(result.error);
      }
    } finally {
      setOauthBusy(null);
    }
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
            KJ
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cb-muted)]">
              Kai KJ
            </p>
            <h2 id="auth-modal-title" className="text-lg font-bold text-[var(--cb-dark)]">
              {mode === "sign-in" ? "Sign in to your account" : "Create your account"}
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
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "sign-in" ? "Enter your password" : "At least 8 characters"}
              className="auth-modal-input"
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button type="submit" disabled={submitting} className="cb-btn-primary h-11 w-full text-sm">
            {submitting
              ? "Please wait..."
              : mode === "sign-in"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--cb-border)]" />
          <span className="text-xs font-medium text-[var(--cb-muted)]">or continue with</span>
          <div className="h-px flex-1 bg-[var(--cb-border)]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={oauthBusy !== null}
            onClick={() => void handleOAuth("google")}
            className="auth-modal-oauth-btn"
          >
            {oauthBusy === "google" ? "..." : "Google"}
          </button>
          <button
            type="button"
            disabled={oauthBusy !== null}
            onClick={() => void handleOAuth("apple")}
            className="auth-modal-oauth-btn"
          >
            {oauthBusy === "apple" ? "..." : "Apple"}
          </button>
        </div>

        <p className="mt-5 text-center text-sm text-[var(--cb-muted)]">
          {mode === "sign-in" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-semibold text-[var(--cb-primary)] hover:underline"
                onClick={() => {
                  setError(null);
                  onModeChange("sign-up");
                }}
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                className="font-semibold text-[var(--cb-primary)] hover:underline"
                onClick={() => {
                  setError(null);
                  onModeChange("sign-in");
                }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
