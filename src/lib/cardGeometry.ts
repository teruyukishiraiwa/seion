import type { AspectRatio } from "../types";
import { EXPORT_SIZES } from "../constants";

/**
 * Text settings that scale the card's typography. Structurally a subset of
 * {@link Settings}, so the app can pass its settings object directly.
 */
export interface CardTextSettings {
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
}

/**
 * Geometry of the SNS card, derived from the aspect ratio's output size.
 * Shared by {@link SnsCard} (rendering) and the pagination logic so that the
 * "what fits on one card" calculation always matches what is drawn.
 */
export interface CardGeometry {
  w: number;
  h: number;
  min: number;
  padding: number;
  titleSize: number;
  bodySize: number;
  footerSize: number;
  titleMarginBottom: number;
  /** Inner content width (inside horizontal padding). */
  innerWidth: number;
  /** Available content height inside padding, above the signature strip. */
  innerHeight: number;
  bodyLineHeight: number;
  /** em */
  bodyLetterSpacing: number;
  titleLineHeight: number;
  /** em */
  titleLetterSpacing: number;
}

/**
 * Text metrics scale relative to the default editor settings (16 / 1.9 /
 * 0.04em), so omitting `text` — or passing the defaults — yields the card's
 * original tuned typography. Card width/height/padding never depend on text.
 */
export function cardGeometry(aspect: AspectRatio, text?: CardTextSettings): CardGeometry {
  const { w, h } = EXPORT_SIZES[aspect];
  const min = Math.min(w, h);
  const padding = min * 0.1;
  const sizeRatio = (text?.fontSize ?? 16) / 16;
  const bodySize = min * 0.032 * sizeRatio;
  return {
    w,
    h,
    min,
    padding,
    titleSize: min * 0.046 * sizeRatio,
    bodySize,
    footerSize: min * 0.022,
    titleMarginBottom: bodySize * 1.4,
    innerWidth: w - padding * 2,
    // Content box spans top:0 → bottom:padding (signature strip reserved),
    // with `padding` of inner padding → usable height = h - 3 * padding.
    innerHeight: h - padding * 3,
    bodyLineHeight: 2.05 * ((text?.lineHeight ?? 1.9) / 1.9),
    bodyLetterSpacing: text?.letterSpacing ?? 0.04,
    titleLineHeight: 1.4,
    titleLetterSpacing: 0.06,
  };
}
