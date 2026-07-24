/**
 * QR Code tool interface.
 * This is a JS-only tool (qr-code-styling), not WASM.
 * Provides the same interface shape for consistency.
 */

import QRCodeStyling from 'qr-code-styling';

function createQr(options = {}) {
  return new QRCodeStyling({
    width: 300,
    height: 300,
    type: 'canvas',
    data: options.data || '',
    ...options,
  });
}

export default {
  create: createQr,
};
