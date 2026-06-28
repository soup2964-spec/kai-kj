import { setAccountEmail } from "@/lib/account-id";

export type AuthResult =
  | { ok: true }
  | { ok: false; error: string };

/** Email sign-in stores the account email locally for expense sync. */
export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!password.trim()) {
    return { ok: false, error: "Enter your password." };
  }

  try {
    setAccountEmail(email);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not sign in.",
    };
  }
}
