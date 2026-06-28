import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ExpenseProvider } from "@/lib/expense-context";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ExpenseProvider>
      <DashboardShell>{children}</DashboardShell>
    </ExpenseProvider>
  );
}
