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

  it("uses export-space signature dimensions in WYSIWYG mode", () => {
    const settings = { ...DEFAULT_SETTINGS, signatureWidth: 432, signatureMarginTop: 130 };
    const card = cardGeometry(settings.aspect);
    expect(signatureWidthForCard(settings)).toBeLessThanOrEqual(card.innerWidth * 0.5);
    expect(signatureMarginForCard(settings)).toBeGreaterThan(0);
  });
});