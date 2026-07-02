import { useEffect, useState } from "react";
import type { Note, Settings } from "../types";
import { paginateBody } from "../lib/paginate";

/**
 * Pages of the current note for SNS export, recomputed whenever an input that
 * affects how text flows onto a card changes. Card typography scales with the
 * text settings (fontSize / lineHeight / letterSpacing), so those are tracked
 * alongside the aspect ratio, title visibility and signature inputs.
 */
export function usePages(note: Note | null, settings: Settings): string[] {
  const [pages, setPages] = useState<string[]>(() => [note?.body ?? ""]);

  useEffect(() => {
    setPages(paginateBody(note, settings));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    note?.id,
    note?.body,
    note?.bodyHtml,
    note?.title,
    settings.splitPages,
    settings.aspect,
    settings.font,
    settings.fontSize,
    settings.lineHeight,
    settings.letterSpacing,
    settings.cardTitleEnabled,
    settings.signatureImage,
    settings.signatureEnabled,
    settings.signatureWidth,
    settings.signatureMarginTop,
    settings.signatureAspectRatio,
  ]);

  return pages;
}
