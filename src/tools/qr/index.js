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

function decodeQr(imageData) {
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  return code ? code.data : null;
}

async function fileToImageData(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

export default {
  create: createQr,
  decode: decodeQr,
  fileToImageData,
};
