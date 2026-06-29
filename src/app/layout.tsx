import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { sourceSans } from "@/lib/fonts";
import { landingFont } from "@/lib/landing-fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Moodna — Expense Tracker",
  description:
    "Scan receipts with your phone and automatically categorize expenses.",
  applicationName: "Moodna",
  appleWebApp: {
    capable: true,
    title: "Moodna",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#225aea" },
    { media: "(prefers-color-scheme: dark)", color: "#225aea" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${landingFont.variable} ios-html h-full`}
      suppressHydrationWarning
    ><body className="ios-body min-h-dvh flex flex-col font-sans antialiased">
        <ClerkProvider>{children}</ClerkProvider>
      </body></html>
  );
}
