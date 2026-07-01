// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from "vitest";
import { normalizeHtml } from "./richText";

beforeAll(() => {
  if (!globalThis.CSS) Object.defineProperty(globalThis, "CSS", { value: {} });
  if (!globalThis.CSS.supports) globalThis.CSS.supports = () => true;
});

describe("normalizeHtml", () => {
  it("keeps editor formatting and removes unsafe style properties and attributes", () => {
    const html = '<div><span style="color: rgb(1, 2, 3); position: fixed; background-image: url(x)" onclick="bad()">本文</span></div>';
    const normalized = normalizeHtml(html);
    expect(normalized).toContain("color:");
    expect(normalized).not.toContain("position");
    expect(normalized).not.toContain("background-image");
    expect(normalized).not.toContain("onclick");
  });

  it("unwraps disallowed elements", () => {
    expect(normalizeHtml("<div><script>alert(1)</script><b>安全</b></div>"))
      .toBe("<div>alert(1)<b>安全</b></div>");
  });
});