import { LEGACY_STORAGE_KEYS, STORAGE_KEYS } from "../constants";

/**
 * One-time, non-destructive migration of pre-rename localStorage.
 *
 * When the app was named "Quiet Manuscript" data lived under `quiet-manuscript:*`
 * keys. We now use `seion:*`. For each key, if the new slot is empty but a legacy
 * value exists, copy it across. The legacy keys are left untouched as a backup.
 */
export function migrateLegacyStorage(): void {
  try {
    (Object.keys(STORAGE_KEYS) as Array<keyof typeof STORAGE_KEYS>).forEach(
      (k) => {
        const target = STORAGE_KEYS[k];
        const legacy = LEGACY_STORAGE_KEYS[k];
        if (
          localStorage.getItem(target) === null &&
          localStorage.getItem(legacy) !== null
        ) {
          localStorage.setItem(target, localStorage.getItem(legacy) as string);
        }
      },
    );
  } catch {
    /* storage unavailable — nothing to migrate */
  }
}
