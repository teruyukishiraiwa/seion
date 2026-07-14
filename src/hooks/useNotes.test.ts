import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, getEffectiveSettings } from "../constants";
import type { Note } from "../types";
import { parseStoredNotes, replaceLegacySampleNotes } from "./useNotes";

describe("parseStoredNotes", () => {
  it("preserves an intentionally empty note collection", () => {
    expect(parseStoredNotes("[]")).toEqual([]);
  });

  it("distinguishes missing and invalid-shaped storage", () => {
    expect(parseStoredNotes(null)).toBeNull();
    expect(parseStoredNotes('{"notes":[]}')).toBeNull();
  });
});

describe("getEffectiveSettings", () => {
  const note = (settings?: Note["settings"]): Note => ({
    id: "note",
    title: "note",
    body: "",
    createdAt: 1,
    updatedAt: 1,
    ...(settings ? { settings } : {}),
  });

  it("applies per-note article parameters over legacy global article settings", () => {
    const globalSettings = {
      ...DEFAULT_SETTINGS,
      aspect: "16:9" as const,
      fontSize: 18,
      theme: "dark" as const,
    };

    const effective = getEffectiveSettings(note({ aspect: "1:1", fontSize: 21 }), globalSettings);

    expect(effective.aspect).toBe("1:1");
    expect(effective.fontSize).toBe(21);
    expect(effective.theme).toBe("dark");
  });

  it("keeps app display preferences global even when a note contains old values", () => {
    const effective = getEffectiveSettings(
      note({ aspect: "1:1" }),
      { ...DEFAULT_SETTINGS, theme: "dark", editorAspectMode: true },
    );

    expect(effective.theme).toBe("dark");
    expect(effective.editorAspectMode).toBe(true);
  });
});
describe("replaceLegacySampleNotes", () => {
  const legacy = (id: string) => ({ id, title: id, body: "", createdAt: 1, updatedAt: 1 });

  it("replaces a collection made only from legacy demo notes", () => {
    const migrated = replaceLegacySampleNotes([legacy("note-asa"), legacy("note-kumo")]);
    expect(migrated).toHaveLength(1);
    expect(migrated[0].id).toBe("note-welcome-to-seion");
    expect(migrated[0].title).toBe("静けさに、言葉を置く");
  });

  it("updates the untouched previous welcome copy", () => {
    const previous = [{ ...legacy("note-welcome-to-seion"), body: "Seionは、言葉のための静かな場所です。\n\n続き" }];
    expect(replaceLegacySampleNotes(previous)[0].body).toContain("言葉を置くための静かな空間");
  });

  it("preserves collections containing a user note", () => {
    const notes = [legacy("note-asa"), legacy("note-user-created")];
    expect(replaceLegacySampleNotes(notes)).toBe(notes);
  });

  it("preserves an intentionally empty collection", () => {
    const notes: ReturnType<typeof replaceLegacySampleNotes> = [];
    expect(replaceLegacySampleNotes(notes)).toBe(notes);
  });
});
