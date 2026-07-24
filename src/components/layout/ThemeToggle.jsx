const ORDER = ['auto', 'light', 'dark'];

const LABELS = {
  auto: 'Auto',
  light: 'Light',
  dark: 'Dark',
};

const ICONS = {
  auto: '\u25D0',
  light: '\u2600',
  dark: '\u263D',
};

export function ThemeToggle({ theme, setTheme }) {
  function cycle() {
    const idx = ORDER.indexOf(theme);
    const next = ORDER[(idx + 1) % ORDER.length];
    setTheme(next);
  }

  return (
    <button
      class="theme-toggle"
      onClick={cycle}
      title={`Theme: ${LABELS[theme]}`}
      aria-label={`Switch theme (currently ${LABELS[theme]})`}
    >
      <span class="theme-toggle-icon" aria-hidden="true">{ICONS[theme]}</span>
      <span class="theme-toggle-label">{LABELS[theme]}</span>
    </button>
  );
}
