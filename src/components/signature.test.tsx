// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../constants";
import type { CardPage, Note } from "../types";
import { downscaleSignatureImage } from "../lib/image";
import { signatureWidthForCard, signatureWidthRatio } from "../lib/signatureGeometry";
import { Editor } from "./Editor";
import { SnsCard } from "./SnsCard";

const note: Note = {
  id: "note",
  title: "署名テスト",
  body: "本文",
  createdAt: 1,
  updatedAt: 1,
};

const settings = {
  ...DEFAULT_SETTINGS,
  signatureImage: "data:image/png;base64,c2lnbmF0dXJl",
  signatureEnabled: true,
};

function page(index: number): CardPage {
  return { body: "<div>本文</div>", showTitle: index === 0, index, total: 2 };
}

describe("signature rendering", () => {
  it("renders the signature on the final SNS page only", () => {
    const first = render(<SnsCard note={note} settings={settings} page={page(0)} />);
    expect(first.container.querySelectorAll('img[src^="data:image/png"]').length).toBe(0);
    first.unmount();

    const last = render(<SnsCard note={note} settings={settings} page={page(1)} />);
    expect(last.container.querySelectorAll('img[src^="data:image/png"]').length).toBe(1);
  });

  it("shows a non-editable right-aligned signature after the editor body", () => {
    const view = render(
      <Editor
        note={note}
        settings={settings}
        focusMode={false}
        readOnly={false}
        onChange={vi.fn()}
        onToggleFocus={vi.fn()}
        onToggleAspectMode={vi.fn()}
      />,
    );
    const signature = view.getByLabelText("署名画像");
    expect(signature.className).toContain("justify-end");
    expect(signature.querySelector("img")).toBeTruthy();
  });

  it("rejects formats that cannot preserve the intended signature asset", async () => {
    const file = new File(["jpeg"], "signature.jpg", { type: "image/jpeg" });
    await expect(downscaleSignatureImage(file)).rejects.toThrow("PNG または WebP");
  });
});

describe("signature geometry", () => {
  it("keeps the same relative width across editor and card aspect ratios", () => {
    const ratio = signatureWidthRatio(settings);
    expect(ratio).toBeCloseTo(settings.signatureWidth / 864);
    expect(signatureWidthRatio({ ...settings, signatureWidth: 432 })).toBeCloseTo(0.5);
    expect(signatureWidthForCard({ ...settings, aspect: "16:9" }))
      .toBeCloseTo(1704 * ratio);
  });
});
