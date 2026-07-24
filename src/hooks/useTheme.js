import { useState, useEffect, useCallback } from 'preact/hooks';

const STORAGE_KEY = 'theme';
const VALID_THEMES = ['auto', 'light', 'dark'];
const DARK_QUERY = '(prefers-color-scheme: dark)';

export function useTheme(options = {}) {
  const storage = options.storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  const matchMedia = options.matchMedia ?? (typeof window !== 'undefined' ? window.matchMedia : null);
  const root = options.root ?? (typeof document !== 'undefined' ? document.documentElement : null);

  const [theme, setThemeState] = useState(() => readPreference(storage));

  const [effective, setEffective] = useState(() =>
    resolveEffective(theme, matchMedia),
  );

  useEffect(() => {
    if (root) root.dataset.theme = effective;
  }, [effective, root]);

  useEffect(() => {
    if (theme !== 'auto' || !matchMedia) return;
    const query = matchMedia(DARK_QUERY);
    function onChange(e) {
      setEffective(e.matches ? 'dark' : 'light');
    }
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [theme, matchMedia]);

  const setTheme = useCallback(
    (next) => {
      if (!VALID_THEMES.includes(next)) return;
      setThemeState(next);
      writePreference(storage, next);
      setEffective(resolveEffective(next, matchMedia));
    },
    [storage, matchMedia],
  );

  return { theme, effective, setTheme };
}

function readPreference(storage) {
  if (!storage) return 'auto';
  try {
    const stored = storage.getItem(STORAGE_KEY);
    return VALID_THEMES.includes(stored) ? stored : 'auto';
  } catch {
    return 'auto';
  }
}

function writePreference(storage, value) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, value);
  } catch {}
}

function resolveEffective(theme, matchMedia) {
  if (theme === 'dark') return 'dark';
  if (theme === 'light') return 'light';
  if (!matchMedia) return 'light';
  try {
    return matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}
