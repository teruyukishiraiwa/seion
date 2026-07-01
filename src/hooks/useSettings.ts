import { useCallback, useEffect, useState } from "react";
import type { Settings } from "../types";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../constants";

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_SETTINGS;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  // Surfaced to the UI when persistence fails (usually a quota overflow from a
  // large background image) so the user isn't left thinking their change saved.
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
      setStorageError(null);
    } catch {
      setStorageError(
        "設定を保存できませんでした（保存容量の上限を超えた可能性があります）。背景画像のサイズを小さくしてお試しください。",
      );
    }
  }, [settings]);

  // Reflect theme on <html> so Tailwind's dark: variant applies globally.
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [settings.theme]);

  const update = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearStorageError = useCallback(() => setStorageError(null), []);

  return { settings, update, storageError, clearStorageError };
}
