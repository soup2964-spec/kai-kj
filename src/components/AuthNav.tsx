"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";

type AuthNavProps = {
  variant?: "landing" | "dashboard";
};

export function AuthNav({ variant = "landing" }: AuthNavProps) {
  if (variant === "dashboard") {
    return (
      <div className="flex items-center gap-3">
        <Show when="signed-in">
          <UserButton />
        </Show>
        <Link href="/" className="qb-btn-ghost text-sm">
          Home
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href="/sign-in" className="qb-btn-ghost text-sm">
        Sign in
      </Link>
      <Link href="/sign-up" className="qb-btn-primary text-sm">
        Get started
      </Link>
    </>
  );
}
