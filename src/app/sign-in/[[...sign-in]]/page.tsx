import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-qb-bg px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-qb-green-dark">
          Kai KJ
        </p>
        <h1 className="mt-1 text-2xl font-bold text-qb-text">Welcome back</h1>
      </div>
      <SignIn
        forceRedirectUrl="/dashboard"
        appearance={{
          variables: {
            colorPrimary: "#2ca01c",
          },
          elements: {
            rootBox: "mx-auto",
            card: "qb-card shadow-none",
          },
        }}
      />
    </div>
  );
}
