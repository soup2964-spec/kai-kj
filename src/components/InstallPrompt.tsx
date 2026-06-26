"use client";

import { useEffect, useState } from "react";
import { isIOS, isStandalone } from "@/lib/ios";

const DISMISS_KEY = "kai-kj-install-dismissed";

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    if (isIOS()) setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-qb-blue/20 bg-[#e8f4fd] px-4 py-3">
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-qb-blue text-[10px] font-bold text-white">
        i
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-qb-text">
          Install on your iPhone
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-qb-text-secondary">
          Tap{" "}
          <span className="rounded border border-qb-border bg-white px-1.5 py-0.5 text-xs font-semibold">
            Share
          </span>{" "}
          in Safari, then{" "}
          <span className="rounded border border-qb-border bg-white px-1.5 py-0.5 text-xs font-semibold">
            Add to Home Screen
          </span>
        </p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          localStorage.setItem(DISMISS_KEY, "1");
          setVisible(false);
        }}
        className="shrink-0 px-1 text-qb-text-muted hover:text-qb-text"
      >
        ✕
      </button>
    </div>
  );
}
