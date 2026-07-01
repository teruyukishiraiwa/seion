import { describe, expect, it } from "vitest";
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