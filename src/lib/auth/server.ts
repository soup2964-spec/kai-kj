import { auth } from "@clerk/nextjs/server";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function requireOwnerId(requestOwnerId?: string | null): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new AuthError("Sign in to continue.");
  }

  const normalizedRequestOwnerId = requestOwnerId?.trim();
  if (normalizedRequestOwnerId && normalizedRequestOwnerId !== userId) {
    throw new AuthError("Account mismatch.");
  }

  return userId;
}

export function authErrorStatus(error: unknown): number {
  return error instanceof AuthError ? 401 : 400;
}
