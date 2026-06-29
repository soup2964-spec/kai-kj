import Link from "next/link";

type AuthNavProps = {
  variant?: "landing" | "dashboard";
};

export function AuthNav({ variant = "landing" }: AuthNavProps) {
  if (variant === "dashboard") {
    return (
      <Link href="/" className="qb-btn-ghost text-sm">
        Home
      </Link>
    );
  }

  return (
    <>
      <Link href="/sign-in" className="qb-btn-ghost text-sm">
        Sign in
      </Link>
      <Link href="/dashboard" className="qb-btn-primary text-sm">
        Get started
      </Link>
    </>
  );
}
