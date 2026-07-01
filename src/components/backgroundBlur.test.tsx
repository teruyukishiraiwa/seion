// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../constants";
import {
  backgroundBlurForCard,
  backgroundBlurForEditor,
  backgroundScaleForCard,
} from "../lib/backgroundGeometry";
import { SnsCard } from "./SnsCard";
import { Editor } from "./Editor";

describe("background blur geometry", () => {
  it("disables blur and overscan at zero", () => {
    expect(backgroundBlurForCard(DEFAULT_SETTINGS)).toBe(0);
    expect(backgroundScaleForCard(DEFAULT_SETTINGS)).toBe(1);
  });

  it("normalizes the editor blur and reserves overscan at maximum strength", () => {
    const settings = { ...DEFAULT_SETTINGS, backgroundBlur: 40 };
    expect(backgroundBlurForEditor(settings)).toBeCloseTo(40 * 640 / 1080);
    expect(backgroundScaleForCard(settings)).toBeCloseTo(1 + 160 / 1080);
  });

  it("applies the same normalized filter to the SNS preview/export card", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      backgroundImage: "data:image/jpeg;base64,YmFja2dyb3VuZA==",
      backgroundBlur: 20,
    };
    const view = render(<SnsCard note={null} settings={settings} />);
    const image = view.container.querySelector("img");
    expect(image?.style.filter).toBe("blur(20px)");
    expect(Number(image?.style.transform.match(/[\d.]+/)?.[0])).toBeCloseTo(
      backgroundScaleForCard(settings),
    );
  });

  it("clips the expanded editor background inside the writing pane", () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      backgroundImage: "data:image/jpeg;base64,YmFja2dyb3VuZA==",
      backgroundBlur: 40,
    };
    const note = {
      id: "blur-note",
      title: "背景テスト",
      body: "本文",
      createdAt: 1,
      updatedAt: 1,
    };
    const view = render(
      <Editor
        note={note}
        settings={settings}
        focusMode={false}
        readOnly={false}
        onChange={() => undefined}
        onToggleFocus={() => undefined}
        onToggleAspectMode={() => undefined}
      />,
    );
    const image = view.container.querySelector("img[src^=\"data:image/jpeg\"]");
    expect(image?.parentElement?.className).toContain("overflow-hidden");
  });
});