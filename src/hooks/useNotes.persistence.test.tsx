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
