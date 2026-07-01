import { useEffect, useState } from "react";
import type { Note, Settings } from "../types";
import { paginateBody } from "../lib/paginate";

/**
 * Pages of the current note for SNS export, recomputed whenever an input that
 * affects how text flows onto a card changes. The card body uses sizes derived
 * from the aspect ratio (not the editor's font settings), so only those inputs
 * are tracked.
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
    settings.signatureImage,
    settings.signatureEnabled,
    settings.signatureWidth,
    settings.signatureMarginTop,
    settings.signatureAspectRatio,
  ]);

  return pages;
}
