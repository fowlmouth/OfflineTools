/**
 * Password generation logic.
 *
 * All functions are pure and accept an injectable `random` function returning a
 * float in [0, 1) so tests can produce deterministic output. They default to
 * Math.random for production use.
 */

const SETS = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
};

const AMBIGUOUS = 'il1Lo0O';

export function buildCharset(options) {
  const enabled = [];
  for (const key of ['lowercase', 'uppercase', 'numbers', 'symbols']) {
    if (options[key]) enabled.push(SETS[key]);
  }

  const pools = options.excludeAmbiguous
    ? enabled.map((set) => stripChars(set, AMBIGUOUS)).filter((set) => set.length > 0)
    : enabled;

  const chars = pools.join('');
  return { chars, pools };
}

function stripChars(set, remove) {
  let out = '';
  for (const c of set) {
    if (!remove.includes(c)) out += c;
  }
  return out;
}

export function generatePassword(options, random = Math.random) {
  const length = options.length ?? 16;
  if (length <= 0) return '';

  const { chars, pools } = buildCharset(options);
  if (chars.length === 0) return '';

  const result = [];

  for (const pool of pools) {
    if (result.length >= length) break;
    result.push(pick(pool, random));
  }

  while (result.length < length) {
    result.push(pick(chars, random));
  }

  shuffle(result, random);

  return result.slice(0, length).join('');
}

export function generateBatch(options, random = Math.random) {
  const count = options.count ?? 1;
  const batch = [];
  for (let i = 0; i < count; i++) {
    batch.push(generatePassword(options, random));
  }
  return batch;
}

function pick(pool, random) {
  return pool[Math.floor(random() * pool.length)];
}

function shuffle(arr, random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

const STRENGTH_LABELS = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

export function estimateStrength(password) {
  if (typeof password !== 'string' || password.length === 0) {
    return { bits: 0, score: 0, label: 'Very Weak' };
  }

  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 24;

  const bits = Math.round(password.length * Math.log2(pool || 1));
  const score = scoreFromBits(bits);
  return { bits, score, label: STRENGTH_LABELS[score] };
}

const SCORE_THRESHOLDS = [0, 10, 36, 60, 96];

function scoreFromBits(bits) {
  let score = 0;
  for (let i = 0; i < SCORE_THRESHOLDS.length; i++) {
    if (bits >= SCORE_THRESHOLDS[i]) score = i;
  }
  return score;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
