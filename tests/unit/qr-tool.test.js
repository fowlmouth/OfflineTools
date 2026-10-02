import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { jsQrMock, QRCodeStylingMock } = vi.hoisted(() => ({
  jsQrMock: vi.fn(),
  QRCodeStylingMock: vi.fn(),
}));

vi.mock('jsqr', () => ({ default: jsQrMock }));
vi.mock('qr-code-styling', () => ({ default: QRCodeStylingMock }));

import qrTool from '../../src/tools/qr/index.js';

describe('qr tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('returns a QRCodeStyling instance with the given data', () => {
      QRCodeStylingMock.mockImplementation(function (options) {
        this.options = options;
      });

      const result = qrTool.create({ data: 'hello' });

      expect(result.options).toEqual(expect.objectContaining({ data: 'hello' }));
      expect(QRCodeStylingMock).toHaveBeenCalledWith(expect.objectContaining({ data: 'hello' }));
    });
  });

  describe('decode', () => {
    it('returns the decoded string when jsQR finds a code', () => {
      jsQrMock.mockReturnValue({ data: 'https://example.com' });
      const imageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 };

      expect(qrTool.decode(imageData)).toBe('https://example.com');
      expect(jsQrMock).toHaveBeenCalledWith(imageData.data, 1, 1);
    });

    it('returns null when no QR code is found', () => {
      jsQrMock.mockReturnValue(null);
      const imageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 };

      expect(qrTool.decode(imageData)).toBeNull();
    });
  });

  describe('fileToImageData', () => {
    it('draws the file bitmap onto a canvas and returns its image data', async () => {
      const imageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 };
      const ctx = { drawImage: vi.fn(), getImageData: vi.fn(() => imageData) };
      const getContextSpy = vi
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(ctx);
      const bitmap = { width: 1, height: 1, close: vi.fn() };
      const createImageBitmapMock = vi.fn().mockResolvedValue(bitmap);
      vi.stubGlobal('createImageBitmap', createImageBitmapMock);

      const file = new File([new Uint8Array(4)], 'qr.png', { type: 'image/png' });
      const result = await qrTool.fileToImageData(file);

      expect(result).toBe(imageData);
      expect(createImageBitmapMock).toHaveBeenCalledWith(file);
      expect(ctx.drawImage).toHaveBeenCalledWith(bitmap, 0, 0);
      expect(ctx.getImageData).toHaveBeenCalledWith(0, 0, 1, 1);
      expect(bitmap.close).toHaveBeenCalled();

      getContextSpy.mockRestore();
      vi.unstubAllGlobals();
    });

    it('rejects when the file cannot be decoded to a bitmap', async () => {
      vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bad file')));

      const file = new File([new Uint8Array(4)], 'broken.png', { type: 'image/png' });
      await expect(qrTool.fileToImageData(file)).rejects.toThrow('bad file');

      vi.unstubAllGlobals();
    });
  });
});
