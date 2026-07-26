export const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];

export function isSupportedAlgorithm(algorithm) {
  return HASH_ALGORITHMS.includes(normalizeAlgorithm(algorithm));
}

export async function hash(input, algorithm = 'SHA-256') {
  if (typeof input !== 'string') {
    throw new TypeError('hash expects a string');
  }
  const algo = normalizeAlgorithm(algorithm);
  if (!HASH_ALGORITHMS.includes(algo)) {
    throw new Error(`Unsupported hash algorithm: ${algorithm}`);
  }
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto is unavailable in this environment');
  }
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest(algo, data);
  return bufferToHex(digest);
}

function normalizeAlgorithm(algorithm) {
  return String(algorithm).toUpperCase();
}

function bufferToHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}
