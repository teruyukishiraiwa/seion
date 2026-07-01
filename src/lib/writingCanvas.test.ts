import { describe, expect, it } from "vitest";
import { fitWritingCanvas } from "./writingCanvas";

describe("fitWritingCanvas", () => {
  it.each([
    ["1:1" as const, 620, 620],
    ["9:16" as const, 348.75, 620],
    ["16:9" as const, 672, 378],
  ])("fits %s inside the stage", (aspect, width, height) => {
    const result = fitWritingCanvas(672, 620, aspect);
    expect(result.width).toBeCloseTo(width);
    expect(result.height).toBeCloseTo(height);
  });

  it("returns zero size when no usable area exists", () => {
    expect(fitWritingCanvas(0, 620, "9:16")).toEqual({ width: 0, height: 0 });
  });

  it("never exceeds either available dimension", () => {
    const result = fitWritingCanvas(280, 300, "16:9");
    expect(result.width).toBeLessThanOrEqual(280);
    expect(result.height).toBeLessThanOrEqual(300);
    expect(result.width / result.height).toBeCloseTo(16 / 9);
  });
});