// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import type { Note } from "../types";

afterEach(cleanup);

const notes: Note[] = [
  { id: "active", title: "通常", body: "本文", createdAt: 1, updatedAt: 2 },
  { id: "trash", title: "削除済み", body: "本文", createdAt: 1, updatedAt: 2, trashedAt: 3 },
];

describe("Sidebar controls", () => {
  it("switches between normal/trash and list/card views", () => {
    render(
      <Sidebar
        notes={notes}
        selectedId="active"
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onTrash={vi.fn()}
        onRestore={vi.fn()}
        onDeletePermanently={vi.fn()}
        onEmptyTrash={vi.fn()}
      />,
    );
    expect(screen.getByText("通常")).toBeTruthy();
    expect(screen.queryByText("削除済み")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /ゴミ箱（1件）/ }));
    expect(screen.getByText("削除済み")).toBeTruthy();
    expect(screen.queryByText("通常")).toBeNull();

    const layout = screen.getByRole("button", { name: "カード表示に切り替え" });
    fireEvent.click(layout);
    expect(layout.getAttribute("aria-pressed")).toBe("true");
    expect(layout.getAttribute("aria-label")).toBe("リスト表示に切り替え");
  });
});

describe("TopBar menu", () => {
  it("exposes responsive panel controls with expanded state", () => {
    const onToggleNotes = vi.fn();
    const onToggleSettings = vi.fn();
    render(
      <TopBar saving={false} theme="light" focusMode={false} onSetTheme={vi.fn()} onCreate={vi.fn()} onSetFocusMode={vi.fn()} onSave={vi.fn()} onExport={vi.fn()} installAvailable={false} onInstall={vi.fn()} mobilePanel="notes" onToggleNotes={onToggleNotes} onToggleSettings={onToggleSettings} />,
    );
    const notesButton = screen.getByRole("button", { name: "ノート一覧" });
    expect(notesButton.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(notesButton);
    fireEvent.click(screen.getByRole("button", { name: "設定" }));
    expect(onToggleNotes).toHaveBeenCalledOnce();
    expect(onToggleSettings).toHaveBeenCalledOnce();
  });

  it("supports arrow navigation and Escape close", () => {
    render(
      <TopBar
        saving={false}
        theme="light"
        focusMode={false}
        onSetTheme={vi.fn()}
        onCreate={vi.fn()}
        onSetFocusMode={vi.fn()}
        onSave={vi.fn()}
        onExport={vi.fn()}
        installAvailable={false}
        onInstall={vi.fn()}
        mobilePanel={null}
        onToggleNotes={vi.fn()}
        onToggleSettings={vi.fn()}
      />,
    );
    const trigger = screen.getByRole("button", { name: "メニュー" });
    fireEvent.click(trigger);
    const first = screen.getByRole("menuitem", { name: "新規ノート" });
    first.focus();
    fireEvent.keyDown(first, { key: "ArrowDown" });
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "保存" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe("Sidebar trash confirmation", () => {
  it("calls the logical-delete handler after confirmation", () => {
    const onTrash = vi.fn();
    render(
      <Sidebar
        notes={[notes[0]]}
        selectedId="active"
        onSelect={vi.fn()}
        onCreate={vi.fn()}
        onTrash={onTrash}
        onRestore={vi.fn()}
        onDeletePermanently={vi.fn()}
        onEmptyTrash={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "ノートをゴミ箱へ移動" }));
    fireEvent.click(screen.getByRole("button", { name: "移動" }));
    expect(onTrash).toHaveBeenCalledWith("active");
  });
});
