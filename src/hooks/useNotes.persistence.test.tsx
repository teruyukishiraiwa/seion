// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEYS } from "../constants";
import { useNotes } from "./useNotes";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("useNotes persistence", () => {
  it("surfaces an autosave failure to the UI state", () => {
    localStorage.setItem(STORAGE_KEYS.notes, "[]");
    vi.useFakeTimers();
    const { result } = renderHook(() => useNotes());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("quota", "QuotaExceededError");
    });

    act(() => result.current.createNote());
    act(() => vi.advanceTimersByTime(500));

    expect(result.current.storageError).toContain("ノートを保存できませんでした");
    expect(result.current.saving).toBe(false);
  });

  it("stores article settings on the note and keeps updates scoped to that note", () => {
    localStorage.setItem(STORAGE_KEYS.notes, "[]");
    const { result } = renderHook(() => useNotes());

    act(() => result.current.createNote({ aspect: "1:1", fontSize: 21 }));
    const firstId = result.current.selectedId;
    act(() => result.current.createNote({ aspect: "9:16", fontSize: 16 }));
    const secondId = result.current.selectedId;
    act(() => result.current.updateNote(firstId, { settings: { aspect: "16:9" } }));

    const first = result.current.notes.find((note) => note.id === firstId);
    const second = result.current.notes.find((note) => note.id === secondId);

    expect(first?.settings?.aspect).toBe("16:9");
    expect(first?.settings?.fontSize).toBe(21);
    expect(second?.settings?.aspect).toBe("9:16");
  });
});

describe("useNotes page lifecycle", () => {
  it("flushes pending note changes when the page is hidden", () => {
    localStorage.setItem(STORAGE_KEYS.notes, "[]");
    const { result } = renderHook(() => useNotes());

    act(() => result.current.createNote());
    act(() => window.dispatchEvent(new Event("pagehide")));

    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.notes) ?? "[]")).toHaveLength(1);
  });
});
