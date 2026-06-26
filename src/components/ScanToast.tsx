"use client";

import { useEffect } from "react";
import { IconCheck } from "./icons";

interface ScanToastProps {
  visible: boolean;
  message?: string;
  onDismiss: () => void;
}

export function ScanToast({
  visible,
  message = "Scanned",
  onDismiss,
}: ScanToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className="qb-toast qb-toast-visible"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="qb-toast-icon">
        <IconCheck className="h-4 w-4" />
      </span>
      <span className="qb-toast-text">{message}</span>
    </div>
  );
}
