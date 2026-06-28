import { setAccountEmail } from "@/lib/account-id";

export type AuthMode = "sign-in" | "sign-up";

export type AuthResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Interim email/password auth until Clerk is wired up.
 * Replace the body of these functions with Clerk signIn / signUp calls.
 */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!password.trim()) {
    return { ok: false, error: "Enter your password." };
  }

  try {
    // TODO(clerk): return clerkSignIn(email, password)
    setAccountEmail(email);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not sign in.",
    };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  try {
    // TODO(clerk): return clerkSignUp(email, password)
    setAccountEmail(email);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not create account.",
    };
  }
}

export async function signInWithOAuth(
  _provider: "google" | "apple",
): Promise<AuthResult> {
  // TODO(clerk): return clerkOAuth(provider)
  return {
    ok: false,
    error: "Social sign-in will be available when Clerk is connected.",
  };
}
