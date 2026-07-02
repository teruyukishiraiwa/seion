// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../constants";
import type { Note } from "../types";
import { Editor } from "./Editor";

afterEach(cleanup);

const note: Note = {
  id: "ime-note",
  title: "題",
  body: "本文",
  bodyHtml: "<div>本文</div>",
  createdAt: 1,
  updatedAt: 1,
};

function renderEditor(onChange = vi.fn(), pages = ["<div>本文</div>"]) {
  render(
    <Editor
      note={note}
      settings={{ ...DEFAULT_SETTINGS, splitPages: pages.length > 1 }}
      focusMode={false}
      readOnly={false}
      onChange={onChange}
      onToggleFocus={vi.fn()}
      onToggleAspectMode={vi.fn()}
      pages={pages}
    />,
  );
  return { onChange, body: screen.getByRole("textbox", { name: "本文" }) };
}

class ResizeObserverMock {
  observe() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);

describe("Editor pagination and IME", () => {
  it("defers body synchronization until composition ends", () => {
    const { body, onChange } = renderEditor();
    fireEvent.compositionStart(body);
    body.innerHTML = "<div>変換中</div>";
    fireEvent.input(body);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.compositionEnd(body);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ body: "変換中" }));
  });

  it("announces the current split page count", () => {
    renderEditor(vi.fn(), ["<div>一</div>", "<div>二</div>", "<div>三</div>"]);
    expect(screen.getByText("3ページに分割")).toBeTruthy();
  });

  it("restores rich body content when switching aspect mode in both directions", () => {
    const onChange = vi.fn();
    const props = { note, focusMode: false, readOnly: false, onChange, onToggleFocus: vi.fn(), onToggleAspectMode: vi.fn() };
    const { rerender } = render(<Editor {...props} settings={{ ...DEFAULT_SETTINGS, editorAspectMode: false }} />);
    const fluidBody = screen.getByRole("textbox", { name: "本文" });
    fluidBody.innerHTML = "<div><strong>保持する本文</strong></div>";
    fireEvent.input(fluidBody);

    const updatedNote = { ...note, body: "保持する本文", bodyHtml: "<div><strong>保持する本文</strong></div>" };
    rerender(<Editor {...props} note={updatedNote} settings={{ ...DEFAULT_SETTINGS, editorAspectMode: true }} />);
    expect(screen.getByRole("textbox", { name: "本文" }).innerHTML).toContain("保持する本文");

    rerender(<Editor {...props} note={updatedNote} settings={{ ...DEFAULT_SETTINGS, editorAspectMode: false }} />);
    expect(screen.getByRole("textbox", { name: "本文" }).innerHTML).toContain("保持する本文");
  });

  it("clips the editable first page at pages[0] without deleting later blocks", () => {
    const longNote = { ...note, body: "一\n二\n三", bodyHtml: "<div>一</div><div>二</div><div>三</div>" };
    render(
      <Editor note={longNote} settings={{ ...DEFAULT_SETTINGS, editorAspectMode: true, splitPages: true }} focusMode={false} readOnly={false} onChange={vi.fn()} onToggleFocus={vi.fn()} onToggleAspectMode={vi.fn()} pages={["<div>一</div>", "<div>二</div><div>三</div>"]} />,
    );
    const body = screen.getByRole("textbox", { name: "本文" });
    expect(body.children).toHaveLength(3);
    expect(document.querySelector("style")?.textContent).toContain(":nth-child(n + 2)");
  });

  it("renders every split page in the WYSIWYG page stack", () => {
    render(
      <Editor note={note} settings={{ ...DEFAULT_SETTINGS, editorAspectMode: true, splitPages: true }} focusMode={false} readOnly={false} onChange={vi.fn()} onToggleFocus={vi.fn()} onToggleAspectMode={vi.fn()} pages={["<div>一</div>", "<div>二</div>", "<div>三</div>"]} />,
    );
    expect(screen.getByTestId("page-stack")).toBeTruthy();
    expect(screen.getByTestId("writing-page-2")).toBeTruthy();
    expect(screen.getByTestId("writing-page-3")).toBeTruthy();
  });

  it("lets clicks reach the body editor through the empty-note placeholder in aspect mode", () => {
    const emptyNote = { ...note, body: "", bodyHtml: "" };
    render(
      <Editor note={emptyNote} settings={{ ...DEFAULT_SETTINGS, editorAspectMode: true }} focusMode={false} readOnly={false} onChange={vi.fn()} onToggleFocus={vi.fn()} onToggleAspectMode={vi.fn()} />,
    );
    const placeholder = screen.getByText("いま感じていることを、静かに書きとめてください。");
    expect(placeholder.style.pointerEvents).toBe("none");
  });

  it("tags the WYSIWYG card with the layer mode so selection color follows the layer, not the theme", () => {
    const props = { note, focusMode: false, readOnly: false, onChange: vi.fn(), onToggleFocus: vi.fn(), onToggleAspectMode: vi.fn() };
    const { rerender } = render(<Editor {...props} settings={{ ...DEFAULT_SETTINGS, editorAspectMode: true, overlayColor: "light" }} />);
    expect(screen.getByTestId("writing-canvas").className).toContain("layer-light");
    rerender(<Editor {...props} settings={{ ...DEFAULT_SETTINGS, editorAspectMode: true, overlayColor: "dark" }} />);
    expect(screen.getByTestId("writing-canvas").className).toContain("layer-dark");
  });

  it("applies a fixed display zoom without changing export geometry", () => {
    render(
      <Editor note={note} settings={{ ...DEFAULT_SETTINGS, editorAspectMode: true }} focusMode={false} readOnly={false} onChange={vi.fn()} onToggleFocus={vi.fn()} onToggleAspectMode={vi.fn()} />,
    );
    fireEvent.change(screen.getByLabelText("表示倍率"), { target: { value: "1" } });
    const canvas = screen.getByTestId("writing-canvas");
    expect(canvas.style.transform).toBe("scale(1)");
    const stage = canvas.closest("main")?.firstElementChild as HTMLElement | null;
    expect(stage?.style.justifyContent).toBe("safe center");
    expect(stage?.style.alignItems).toBe("safe center");
  });
});