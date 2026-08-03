/**
 * Persistent state hook — saves to localStorage and optionally syncs to
 * the backend module API when a projectId is available.
 *
 * Load order (highest priority wins):
 *   1. Backend DB data  (if projectId is set and module has been saved)
 *   2. localStorage     (if cached locally)
 *   3. initialValue     (hardcoded default)
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { updateProjectModule, fetchProjectModule } from './project';

const AUTOSAVE_DELAY = 1500; // ms debounce

export function useModuleState<T>(
  moduleName: string,
  initialValue: T,
  projectId?: string
): [T, (value: T | ((prev: T) => T)) => void, () => Promise<void>, boolean] {
  const storageKey = `gameforge_${moduleName}`;

  // Initialize from localStorage first (instant, no flicker)
  const [state, setStateInternal] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored) as T;
    } catch {
      // ignore parse errors
    }
    return initialValue;
  });

  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<T>(state);
  latestRef.current = state;

  // ─── Hydrate from backend when projectId becomes available ──────────────
  useEffect(() => {
    if (!projectId || hydrated) return;

    let cancelled = false;

    fetchProjectModule<T>(projectId, moduleName)
      .then(({ data }) => {
        if (cancelled) return;
        if (data != null) {
          // Backend has saved data — override localStorage
          setStateInternal(data);
          try {
            localStorage.setItem(storageKey, JSON.stringify(data));
          } catch {
            // quota exceeded — ignore
          }
        }
        setHydrated(true);
      })
      .catch(() => {
        if (!cancelled) setHydrated(true); // backend failed — keep localStorage data
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, moduleName, storageKey, hydrated]);

  // ─── Persist to localStorage + debounce backend save ────────────────────
  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStateInternal((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;

        // Always write to localStorage immediately
        try {
          localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {
          // quota exceeded — skip
        }

        // Debounce backend sync
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
          if (projectId) {
            setSaving(true);
            try {
              await updateProjectModule(projectId, moduleName, next);
            } catch {
              // silently fail — localStorage still persists state
            } finally {
              setSaving(false);
            }
          }
        }, AUTOSAVE_DELAY);

        return next;
      });
    },
    [storageKey, moduleName, projectId]
  );

  // ─── Manual save (bypasses debounce) ────────────────────────────────────
  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!projectId) return;

    setSaving(true);
    try {
      await updateProjectModule(projectId, moduleName, latestRef.current);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }, [moduleName, projectId]);

  // ─── Cleanup on unmount ──────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return [state, setState, saveNow, saving];
}
