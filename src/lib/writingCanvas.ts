import { EXPORT_SIZES } from "../constants";
import type { AspectRatio } from "../types";

export interface WritingCanvasSize {
  width: number;
  height: number;
}

/** Returns the largest aspect-ratio-locked rectangle inside the available area. */
export function fitWritingCanvas(
  availableWidth: number,
  availableHeight: number,
  aspect: AspectRatio,
): WritingCanvasSize {
  if (availableWidth <= 0 || availableHeight <= 0) return { width: 0, height: 0 };
  const output = EXPORT_SIZES[aspect];
  const scale = Math.min(availableWidth / output.w, availableHeight / output.h);
  return { width: output.w * scale, height: output.h * scale };
}
/** Shared display scale for editor and preview surfaces. */
export function fitCardScale(
  availableWidth: number,
  availableHeight: number,
  aspect: AspectRatio,
): number {
  const output = EXPORT_SIZES[aspect];
  const fitted = fitWritingCanvas(availableWidth, availableHeight, aspect);
  return output.w > 0 ? fitted.width / output.w : 0;
}