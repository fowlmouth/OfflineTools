/**
 * QR Code tool interface.
 * JS-only tool (qr-code-styling for encoding, jsqr for decoding), not WASM.
 * Provides the same interface shape for consistency.
 */

import QRCodeStyling from 'qr-code-styling';
import jsQR from 'jsqr';

function createQr(options = {}) {
  return new QRCodeStyling({
    width: 300,
    height: 300,
    type: 'canvas',
    data: options.data || '',
    ...options,
  });
}

const MIN_UPSCALE_SIDE = 500;
const MAX_UPSCALE_FACTOR = 4;
const TILE_SCALES = [0.6, 0.35];
const MIN_TILE_SIZE = 80;
const MAX_TILE_SCAN_SIDE = 1400;

function tryDecode(imageData) {
  const code = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'attemptBoth',
  });
  return code && code.data ? code.data : null;
}

function luma(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function normalizeContrast(imageData) {
  const { data } = imageData;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const l = luma(data[i], data[i + 1], data[i + 2]);
    if (l < min) min = l;
    if (l > max) max = l;
  }
  const range = max - min;
  if (range === 0 || range > 240) return imageData;

  const scale = 255 / range;
  const out = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    out[i] = (data[i] - min) * scale;
    out[i + 1] = (data[i + 1] - min) * scale;
    out[i + 2] = (data[i + 2] - min) * scale;
    out[i + 3] = data[i + 3];
  }
  return { data: out, width: imageData.width, height: imageData.height };
}

function resizeImageData(imageData, factor) {
  const { data, width, height } = imageData;
  const w = Math.round(width * factor);
  const h = Math.round(height * factor);
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const sy = Math.max(0, Math.min(height - 1, (y + 0.5) / factor - 0.5));
    const y0 = Math.floor(sy);
    const y1 = Math.min(height - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < w; x++) {
      const sx = Math.max(0, Math.min(width - 1, (x + 0.5) / factor - 0.5));
      const x0 = Math.floor(sx);
      const x1 = Math.min(width - 1, x0 + 1);
      const fx = sx - x0;
      const di = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const i00 = (y0 * width + x0) * 4 + c;
        const i10 = (y0 * width + x1) * 4 + c;
        const i01 = (y1 * width + x0) * 4 + c;
        const i11 = (y1 * width + x1) * 4 + c;
        const top = data[i00] * (1 - fx) + data[i10] * fx;
        const bottom = data[i01] * (1 - fx) + data[i11] * fx;
        out[di + c] = top * (1 - fy) + bottom * fy;
      }
      out[di + 3] = data[(y0 * width + x0) * 4 + 3];
    }
  }
  return { data: out, width: w, height: h };
}

function cropImageData(imageData, x, y, w, h) {
  const out = new Uint8ClampedArray(w * h * 4);
  for (let row = 0; row < h; row++) {
    const src = ((y + row) * imageData.width + x) * 4;
    out.set(imageData.data.subarray(src, src + w * 4), row * w * 4);
  }
  return { data: out, width: w, height: h };
}

function tilePositions(end, stride) {
  const positions = [];
  for (let p = 0; p < end; p += stride) positions.push(p);
  if (positions[positions.length - 1] !== end) positions.push(end);
  return positions;
}

function decodeViaTiles(imageData) {
  let img = imageData;
  const minSide = Math.min(img.width, img.height);
  if (minSide > MAX_TILE_SCAN_SIDE) {
    img = resizeImageData(img, MAX_TILE_SCAN_SIDE / minSide);
  }

  const side = Math.min(img.width, img.height);
  for (const scale of TILE_SCALES) {
    const size = Math.round(side * scale);
    if (size < MIN_TILE_SIZE || size >= side) continue;
    const stride = Math.max(1, Math.round(size / 3));
    const xs = tilePositions(img.width - size, stride);
    const ys = tilePositions(img.height - size, stride);
    for (const y of ys) {
      for (const x of xs) {
        const result = tryDecode(cropImageData(img, x, y, size, size));
        if (result) return result;
      }
    }
  }
  return null;
}

function decodeQr(imageData) {
  const fromOriginal = tryDecode(imageData);
  if (fromOriginal) return fromOriginal;

  let scaled = null;
  const minSide = Math.min(imageData.width, imageData.height);
  if (minSide > 0 && minSide < MIN_UPSCALE_SIDE) {
    const factor = Math.min(MAX_UPSCALE_FACTOR, Math.ceil(MIN_UPSCALE_SIDE / minSide));
    scaled = resizeImageData(imageData, factor);
    const fromScaled = tryDecode(scaled);
    if (fromScaled) return fromScaled;
  }

  const normalized = normalizeContrast(imageData);
  if (normalized !== imageData) {
    const fromNormalized = tryDecode(normalized);
    if (fromNormalized) return fromNormalized;
  }

  if (scaled) {
    const scaledNormalized = normalizeContrast(scaled);
    if (scaledNormalized !== scaled) {
      const result = tryDecode(scaledNormalized);
      if (result) return result;
    }
  }

  return decodeViaTiles(imageData);
}

const MIN_VECTOR_RASTER_SIZE = 500;
const FALLBACK_IMAGE_SIZE = 1000;

function loadViaImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Unsupported image format: ${file.type || 'unknown'}`));
    };
    img.src = url;
  });
}

async function fileToImageData(file) {
  const isVector = file.type === 'image/svg+xml';
  let source = null;

  if (!isVector && typeof createImageBitmap === 'function') {
    try {
      source = await createImageBitmap(file);
    } catch {
      source = null;
    }
  }

  let width;
  let height;
  if (source) {
    width = source.width;
    height = source.height;
  } else {
    source = await loadViaImageElement(file);
    width = source.naturalWidth || FALLBACK_IMAGE_SIZE;
    height = source.naturalHeight || FALLBACK_IMAGE_SIZE;
    if (isVector) {
      const scale = Math.max(1, MIN_VECTOR_RASTER_SIZE / Math.min(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(source, 0, 0, width, height);
  if (typeof source.close === 'function') source.close();
  return ctx.getImageData(0, 0, width, height);
}

export default {
  create: createQr,
  decode: decodeQr,
  fileToImageData,
};
