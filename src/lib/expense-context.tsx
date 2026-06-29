"use client";

import { createContext, useCallback, useContext } from "react";
import { AuthOwnerSync } from "@/lib/auth/owner-sync";
import { useExpenses } from "./expense-store";

type ExpenseContextValue = ReturnType<typeof useExpenses>;

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const value = useExpenses();
  const handleOwnerChange = useCallback(
    (ownerId: string | null) => {
      if (ownerId) {
        void value.refreshAccount();
      }
    },
    [value.refreshAccount],
  );

  return (
    <ExpenseContext.Provider value={value}>
      <AuthOwnerSync onOwnerChange={handleOwnerChange} />
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpenseContext() {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error("useExpenseContext must be used within ExpenseProvider");
  }
  return context;
}
