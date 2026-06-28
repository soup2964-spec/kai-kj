"use client";

import { BulkUpload } from "@/components/BulkUpload";
import { InstallPrompt } from "@/components/InstallPrompt";
import { ReceiptScanner } from "@/components/ReceiptScanner";
import { useExpenseContext } from "@/lib/expense-context";

export function ReceiptScanPage() {
  const { addExpense } = useExpenseContext();

  return (
    <>
      <ReceiptScanner
        onScanComplete={(result, thumbnailUrl) => {
          addExpense(result, thumbnailUrl);
        }}
      />
      <BulkUpload
        onScanComplete={(result, thumbnailUrl) => {
          addExpense(result, thumbnailUrl);
        }}
      />
      <InstallPrompt />
    </>
  );
}
