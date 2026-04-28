/**
 * CanvasPreferences — per-learner canvas UI state that does not live in the
 * worksheet database (yet).
 *
 * Currently backed by localStorage so it works without a backend schema
 * change.  The store is hidden behind the `CanvasPreferenceStore` interface
 * so it can be swapped for a server-side implementation later without
 * touching any component that uses it.
 *
 * Usage
 * ─────
 * import { canvasPreferences } from '@/components/lean-canvas/CanvasPreferences';
 *
 * // Check skip state
 * canvasPreferences.isSkipped('problem');
 *
 * // Toggle skip
 * canvasPreferences.setSkipped('problem', true);
 * canvasPreferences.setSkipped('problem', false); // un-skip
 *
 * Moving server-side later
 * ────────────────────────
 * 1. Implement a new class that satisfies CanvasPreferenceStore by reading /
 *    writing to an API route.
 * 2. Replace the `canvasPreferences` singleton export with an instance of
 *    the new class.
 * 3. Components that call `canvasPreferences.*` require no changes.
 */

export interface CanvasPreferenceStore {
  /** Whether the learner has explicitly skipped this section. */
  isSkipped(sectionId: string): boolean;

  /** Set or clear the skip flag for a section. */
  setSkipped(sectionId: string, skipped: boolean): void;

  /** Returns all currently skipped section IDs. */
  getSkippedIds(): string[];
}

/* ── localStorage implementation ──────────────────────────────────── */

const STORAGE_KEY = 'calm-commerce:canvas-preferences';

interface StoredPrefs {
  skipped: string[];
}

function readPrefs(): StoredPrefs {
  if (typeof window === 'undefined') return { skipped: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { skipped: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'skipped' in parsed &&
      Array.isArray((parsed as StoredPrefs).skipped)
    ) {
      return parsed as StoredPrefs;
    }
    return { skipped: [] };
  } catch {
    return { skipped: [] };
  }
}

function writePrefs(prefs: StoredPrefs): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Storage quota exceeded or private-browsing restriction — silently ignore.
  }
}

class LocalStoragePreferenceStore implements CanvasPreferenceStore {
  isSkipped(sectionId: string): boolean {
    return readPrefs().skipped.includes(sectionId);
  }

  setSkipped(sectionId: string, skipped: boolean): void {
    const prefs = readPrefs();
    if (skipped) {
      if (!prefs.skipped.includes(sectionId)) {
        prefs.skipped = [...prefs.skipped, sectionId];
      }
    } else {
      prefs.skipped = prefs.skipped.filter((id) => id !== sectionId);
    }
    writePrefs(prefs);
  }

  getSkippedIds(): string[] {
    return readPrefs().skipped;
  }
}

/**
 * Singleton preference store.
 * Swap this for a server-backed implementation to move state server-side.
 */
export const canvasPreferences: CanvasPreferenceStore =
  new LocalStoragePreferenceStore();
