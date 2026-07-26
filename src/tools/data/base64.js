const CHUNK_SIZE = 0x8000;

export function encodeBase64(input) {
  if (typeof input !== 'string') {
    throw new TypeError('encodeBase64 expects a string');
  }
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK_SIZE));
  }
  return btoa(binary);
}

export function decodeBase64(input) {
  if (typeof input !== 'string') {
    throw new TypeError('decodeBase64 expects a string');
  }
  const binary = atob(input.trim());
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
