import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../constants";
import { cardGeometry } from "./cardGeometry";
import { fitWritingCanvas } from "./writingCanvas";
import { signatureMarginForCard, signatureWidthForCard } from "./signatureGeometry";

describe("WYSIWYG document geometry", () => {
  it.each(["1:1", "9:16", "16:9"] as const)("preserves the logical %s card ratio when fitted", (aspect) => {
    const card = cardGeometry(aspect);
    const fitted = fitWritingCanvas(700, 620, aspect);
    expect(fitted.width / fitted.height).toBeCloseTo(card.w / card.h, 8);
  });

  it("keeps all content geometry inside the export card", () => {
    const card = cardGeometry("9:16");
    expect(card.innerWidth).toBe(card.w - card.padding * 2);
    expect(card.innerHeight).toBe(card.h - card.padding * 3);
    expect(card.titleSize).toBeLessThan(card.innerWidth);
    expect(card.bodySize).toBeLessThan(card.titleSize);
  });

  it("matches the legacy metrics when text settings are omitted or at defaults", () => {
    const legacy = cardGeometry("9:16");
    expect(legacy.bodySize).toBeCloseTo(1080 * 0.032, 8);
    expect(legacy.titleSize).toBeCloseTo(1080 * 0.046, 8);
    expect(legacy.bodyLineHeight).toBeCloseTo(2.05, 8);
    expect(legacy.bodyLetterSpacing).toBeCloseTo(0.04, 8);
    const atDefaults = cardGeometry("9:16", { fontSize: 16, lineHeight: 1.9, letterSpacing: 0.04 });
    expect(atDefaults).toEqual(legacy);
  });

  it("scales card typography with the text settings", () => {
    const card = cardGeometry("9:16", { fontSize: 24, lineHeight: 2.6, letterSpacing: 0.2 });
    expect(card.bodySize).toBeCloseTo(1080 * 0.032 * 1.5, 8);
    expect(card.titleSize).toBeCloseTo(1080 * 0.046 * 1.5, 8);
    expect(card.titleMarginBottom).toBeCloseTo(card.bodySize * 1.4, 8);
    expect(card.bodyLineHeight).toBeCloseTo(2.05 * (2.6 / 1.9), 8);
    expect(card.bodyLetterSpacing).toBeCloseTo(0.2, 8);
    // Frame geometry never depends on text settings.
    const legacy = cardGeometry("9:16");
    expect(card.w).toBe(legacy.w);
    expect(card.h).toBe(legacy.h);
    expect(card.padding).toBe(legacy.padding);
    expect(card.innerHeight).toBe(legacy.innerHeight);
  });

  it("uses export-space signature dimensions in WYSIWYG mode", () => {
    const settings = { ...DEFAULT_SETTINGS, signatureWidth: 432, signatureMarginTop: 130 };
    const card = cardGeometry(settings.aspect);
    expect(signatureWidthForCard(settings)).toBeLessThanOrEqual(card.innerWidth * 0.5);
    expect(signatureMarginForCard(settings)).toBeGreaterThan(0);
  });
});