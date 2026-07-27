import { useState, useCallback, useMemo, useRef } from 'preact/hooks';
import {
  generatePassword,
  generateBatch as generateBatchFn,
  estimateStrength,
} from '../tools/password/generator.js';

const MIN_LENGTH = 1;
const MAX_LENGTH = 128;
const COPY_RESET_MS = 1500;

export function usePasswordGenerator(initial = {}) {
  const randomFn = initial.random ?? cryptoRandom;
  const [config, setConfig] = useState(() => ({
    length: initial.length ?? 16,
    lowercase: initial.lowercase ?? true,
    uppercase: initial.uppercase ?? true,
    numbers: initial.numbers ?? true,
    symbols: initial.symbols ?? true,
    excludeAmbiguous: initial.excludeAmbiguous ?? false,
  }));
  const [password, setPassword] = useState('');
  const [batch, setBatch] = useState([]);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);

  const generate = useCallback(() => {
    setPassword(generatePassword(effective(config), randomFn));
  }, [config, randomFn]);

  const setLength = useCallback(
    (value) => {
      const length = clamp(value, MIN_LENGTH, MAX_LENGTH);
      const next = { ...config, length };
      setConfig(next);
      setPassword(generatePassword(effective(next), randomFn));
    },
    [config, randomFn],
  );

  const setOption = useCallback(
    (key, value) => {
      const next = { ...config, [key]: value };
      setConfig(next);
      setPassword(generatePassword(effective(next), randomFn));
    },
    [config, randomFn],
  );

  const setExcludeAmbiguous = useCallback(
    (value) => {
      const next = { ...config, excludeAmbiguous: value };
      setConfig(next);
      setPassword(generatePassword(effective(next), randomFn));
    },
    [config, randomFn],
  );

  const generateBatch = useCallback(
    (count) => {
      setBatch(generateBatchFn({ ...effective(config), count }, randomFn));
    },
    [config, randomFn],
  );

  const copy = useCallback(async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), COPY_RESET_MS);
    } catch {
      /* clipboard unavailable */
    }
  }, [password]);

  const strength = useMemo(() => estimateStrength(password), [password]);

  return {
    length: config.length,
    lowercase: config.lowercase,
    uppercase: config.uppercase,
    numbers: config.numbers,
    symbols: config.symbols,
    excludeAmbiguous: config.excludeAmbiguous,
    password,
    batch,
    copied,
    strength,
    generate,
    setLength,
    setOption,
    setExcludeAmbiguous,
    generateBatch,
    copy,
  };
}

function effective(config) {
  const anyEnabled =
    config.lowercase || config.uppercase || config.numbers || config.symbols;
  return anyEnabled ? config : { ...config, lowercase: true };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cryptoRandom() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] / 0x100000000;
}
