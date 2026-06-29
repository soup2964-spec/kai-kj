import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ExpenseProvider } from "@/lib/expense-context";
import { LiveFeedProvider } from "@/lib/live-feed/context";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ExpenseProvider>
      <LiveFeedProvider>
        <DashboardShell>{children}</DashboardShell>
      </LiveFeedProvider>
    </ExpenseProvider>
  );
}
