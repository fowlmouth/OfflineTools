import { useState, useCallback, useMemo, useRef } from 'preact/hooks';
import {
  hexToRgb,
  rgbToHsl,
  contrastRatio,
  wcagLevel,
} from '../tools/color/convert.js';
import { generatePalette } from '../tools/color/palette.js';

const DEFAULT_BASE = '#3b82f6';
const COPY_RESET_MS = 1500;

export function useColorToolkit(initial = {}) {
  const [base, setBaseState] = useState(initial.base ?? DEFAULT_BASE);
  const [scheme, setSchemeState] = useState(initial.scheme ?? 'triadic');
  const [foreground, setForegroundState] = useState(initial.foreground ?? '#000000');
  const [background, setBackgroundState] = useState(initial.background ?? '#ffffff');
  const [copiedValue, setCopiedValue] = useState(null);
  const copyTimer = useRef(null);

  const rgb = useMemo(() => hexToRgb(base), [base]);
  const hsl = useMemo(() => (rgb ? rgbToHsl(rgb) : null), [rgb]);
  const valid = rgb !== null;

  const palette = useMemo(
    () => (rgb ? generatePalette(base, scheme) : []),
    [base, scheme, rgb],
  );

  const fgRgb = useMemo(() => hexToRgb(foreground), [foreground]);
  const bgRgb = useMemo(() => hexToRgb(background), [background]);
  const contrast = useMemo(() => {
    if (!fgRgb || !bgRgb) return 1;
    return contrastRatio(fgRgb, bgRgb);
  }, [fgRgb, bgRgb]);
  const wcag = useMemo(() => wcagLevel(contrast), [contrast]);

  const setBase = useCallback((value) => setBaseState(value), []);
  const setScheme = useCallback((value) => setSchemeState(value), []);
  const setForeground = useCallback((value) => setForegroundState(value), []);
  const setBackground = useCallback((value) => setBackgroundState(value), []);

  const copy = useCallback(async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopiedValue(null), COPY_RESET_MS);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  return {
    base,
    rgb,
    hsl,
    valid,
    scheme,
    palette,
    foreground,
    background,
    contrast,
    wcag,
    copiedValue,
    setBase,
    setScheme,
    setForeground,
    setBackground,
    copy,
  };
}
