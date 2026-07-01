import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Style the confirm button as a destructive action. */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * A quiet, centered confirmation modal rendered at the document root so it
 * cannot be clipped or covered by a parent panel's stacking context.
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "確認",
  cancelLabel = "キャンセル",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      role="presentation"
      onClick={onCancel}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] motion-safe:animate-overlayIn dark:bg-black/50"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="mx-4 max-h-[calc(100dvh_-_2rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-black/10 bg-paper-panel p-6 shadow-xl motion-safe:animate-dialogIn dark:border-white/10 dark:bg-ink-panel"
      >
        <h2 className="font-serif text-[16px] text-neutral-800 dark:text-neutral-100">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">{message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-[13px] text-neutral-600 transition hover:bg-black/5 active:scale-[0.97] dark:text-neutral-300 dark:hover:bg-white/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-[13px] transition active:scale-[0.97] ${
              danger
                ? "bg-[#b0413e] text-paper-soft hover:bg-[#9a3936]"
                : "bg-neutral-800 text-paper-soft hover:bg-neutral-700 dark:bg-neutral-200 dark:text-ink dark:hover:bg-white"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}