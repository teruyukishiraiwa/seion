import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ArticleSettings, Note } from "../types";
import { STORAGE_KEYS, createSampleNotes } from "../constants";

export function parseStoredNotes(raw: string | null): Note[] | null {
  if (raw === null) return null;
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as Note[]) : null;
}

const LEGACY_SAMPLE_IDS = new Set([
  "note-asa",
  "note-kumo",
  "note-kotoba",
  "note-umibe",
  "note-yoru",
  "note-kaze",
]);

export function replaceLegacySampleNotes(notes: Note[]): Note[] {
  const isLegacyCollection = notes.length > 0 && notes.every((note) => LEGACY_SAMPLE_IDS.has(note.id));
  const isPreviousWelcomeCopy = notes.length === 1 &&
    notes[0].id === "note-welcome-to-seion" &&
    notes[0].body.startsWith("Seionは、言葉のための静かな場所です。");
  return isLegacyCollection || isPreviousWelcomeCopy ? createSampleNotes() : notes;
}

function loadNotes(): Note[] {
  try {
    const parsed = parseStoredNotes(localStorage.getItem(STORAGE_KEYS.notes));
    if (parsed !== null) {
      const migrated = replaceLegacySampleNotes(parsed);
      if (migrated !== parsed) {
        localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(migrated));
        localStorage.setItem(STORAGE_KEYS.selectedId, migrated[0]?.id ?? "");
      }
      return migrated;
    }
  } catch {
    // Corrupt or unavailable storage falls back to the initial sample set.
  }
  return createSampleNotes();
}

function newId(): string {
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const SAVE_ERROR =
  "ノートを保存できませんでした。ブラウザの保存容量やプライベートモードの設定を確認してください。";

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(loadNotes);
  const [selectedId, setSelectedId] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.selectedId) ?? "";
    } catch {
      return "";
    }
  });
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const notesRef = useRef(notes);
  notesRef.current = notes;
  const firstRun = useRef(true);

  useEffect(() => {
    if (notes.length === 0) {
      if (selectedId) setSelectedId("");
      return;
    }
    if (!notes.some((note) => note.id === selectedId)) {
      setSelectedId(notes.find((note) => note.trashedAt == null)?.id ?? notes[0].id);
    }
  }, [notes, selectedId]);

  const persist = useCallback((value: Note[]): boolean => {
    try {
      localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(value));
      setStorageError(null);
      return true;
    } catch {
      setStorageError(SAVE_ERROR);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    const flushOnPageHide = () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
      try {
        localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notesRef.current));
      } catch {
        // The page is leaving; the regular save path reports errors while visible.
      }
    };
    window.addEventListener("pagehide", flushOnPageHide);
    return () => window.removeEventListener("pagehide", flushOnPageHide);
  }, []);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    setSaving(true);
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      persist(notes);
    }, 500);
    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [notes, persist]);

  useEffect(() => {
    if (!selectedId) return;
    try {
      localStorage.setItem(STORAGE_KEYS.selectedId, selectedId);
    } catch {
      setStorageError("選択中のノート情報を保存できませんでした。");
    }
  }, [selectedId]);

  const selected = useMemo(
    () => notes.find((note) => note.id === selectedId) ?? null,
    [notes, selectedId],
  );

  const createNote = useCallback((settings?: Partial<ArticleSettings>) => {
    const now = Date.now();
    const note: Note = {
      id: newId(),
      title: "無題のノート",
      body: "",
      createdAt: now,
      updatedAt: now,
      ...(settings ? { settings } : {}),
    };
    setNotes((previous) => [note, ...previous]);
    setSelectedId(note.id);
  }, []);

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<Note, "title" | "body" | "bodyHtml" | "settings">>) => {
      setNotes((previous) =>
        previous.map((note) =>
          note.id === id && note.trashedAt == null
            ? {
                ...note,
                ...patch,
                settings: patch.settings
                  ? { ...(note.settings ?? {}), ...patch.settings }
                  : note.settings,
                updatedAt: Date.now(),
              }
            : note,
        ),
      );
    },
    [],
  );

  const trashNote = useCallback((id: string) => {
    const now = Date.now();
    setNotes((previous) => {
      const next = previous.map((note) =>
        note.id === id ? { ...note, trashedAt: now, updatedAt: now } : note,
      );
      if (selectedId === id) {
        setSelectedId(next.find((note) => note.trashedAt == null)?.id ?? id);
      }
      return next;
    });
  }, [selectedId]);

  const restoreNote = useCallback((id: string) => {
    setNotes((previous) =>
      previous.map((note) => {
        if (note.id !== id) return note;
        const { trashedAt: _trashedAt, ...restored } = note;
        return { ...restored, updatedAt: Date.now() };
      }),
    );
  }, []);

  const deletePermanently = useCallback((id: string) => {
    setNotes((previous) => previous.filter((note) => note.id !== id));
  }, []);

  const emptyTrash = useCallback(() => {
    setNotes((previous) => previous.filter((note) => note.trashedAt == null));
  }, []);

  const saveNow = useCallback(() => {
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    setSaving(true);
    persist(notes);
  }, [notes, persist]);

  const clearStorageError = useCallback(() => setStorageError(null), []);

  return {
    notes,
    selected,
    selectedId,
    setSelectedId,
    createNote,
    updateNote,
    trashNote,
    restoreNote,
    deletePermanently,
    emptyTrash,
    saving,
    saveNow,
    storageError,
    clearStorageError,
  };
}
