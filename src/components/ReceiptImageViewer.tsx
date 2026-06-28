"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { IconPhoto, IconX } from "./icons";

interface ReceiptImageViewerProps {
  src: string;
  alt?: string;
  /** Compact thumbnail in list rows */
  variant?: "thumb" | "panel";
  className?: string;
}

function ReceiptImageLightbox({
  src,
  alt,
  title,
  onClose,
}: {
  src: string;
  alt: string;
  title: string;
  onClose: () => void;
}) {
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-full max-w-full flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <p id={titleId} className="text-sm font-semibold text-white">
            {title}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close receipt image"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[calc(100vh-6rem)] max-w-[min(100vw-2rem,48rem)] rounded-lg object-contain shadow-2xl"
        />
      </div>
    </div>,
    document.body,
  );
}

export function ReceiptImageViewer({
  src,
  alt = "Receipt",
  variant = "thumb",
  className,
}: ReceiptImageViewerProps) {
  const [open, setOpen] = useState(false);

  if (variant === "panel") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative block w-full overflow-hidden rounded-lg border border-qb-border bg-qb-bg text-left transition hover:border-qb-blue/40"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className={
              className ??
              "max-h-72 w-full object-contain transition group-hover:opacity-95"
            }
          />
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-xs font-semibold text-white">
            <IconPhoto className="h-3.5 w-3.5" />
            View full size
          </span>
        </button>
        {open ? (
          <ReceiptImageLightbox
            src={src}
            alt={alt}
            title="Receipt image"
            onClose={() => setOpen(false)}
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        className="shrink-0 rounded border border-qb-border transition hover:border-qb-blue/50 hover:ring-2 hover:ring-qb-blue/20"
        aria-label="View receipt image"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className={
            className ??
            "h-11 w-11 rounded object-cover lg:h-10 lg:w-10"
          }
        />
      </button>
      {open ? (
        <ReceiptImageLightbox
          src={src}
          alt={alt}
          title="Receipt image"
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
