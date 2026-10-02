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
    const DECODE_OPTIONS = { inversionAttempts: 'attemptBoth' };

    function makeImage(width, height, dark = 0, light = 255) {
      const data = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < width * height; i++) {
        const v = i % 2 === 0 ? dark : light;
        data[i * 4] = v;
        data[i * 4 + 1] = v;
        data[i * 4 + 2] = v;
        data[i * 4 + 3] = 255;
      }
      return { data, width, height };
    }

    it('returns the decoded string when jsQR finds a code', () => {
      jsQrMock.mockReturnValue({ data: 'https://example.com' });
      const imageData = makeImage(300, 300);

      expect(qrTool.decode(imageData)).toBe('https://example.com');
      expect(jsQrMock).toHaveBeenCalledWith(imageData.data, 300, 300, DECODE_OPTIONS);
    });

    it('returns null when no QR code is found', () => {
      jsQrMock.mockReturnValue(null);
      const imageData = makeImage(600, 600);

      expect(qrTool.decode(imageData)).toBeNull();
      expect(jsQrMock.mock.calls[0][1]).toBe(600);
      const widths = jsQrMock.mock.calls.map((call) => call[1]);
      expect(Math.max(...widths)).toBeLessThanOrEqual(600);
    });

    it('decodes on the first attempt without preprocessing when the original works', () => {
      jsQrMock.mockReturnValueOnce({ data: 'plain' });
      const imageData = makeImage(200, 200);

      expect(qrTool.decode(imageData)).toBe('plain');
      expect(jsQrMock).toHaveBeenCalledTimes(1);
    });

    it('retries with an upscaled copy when the image is small', () => {
      jsQrMock.mockReturnValue(null);
      const imageData = makeImage(100, 100);

      expect(qrTool.decode(imageData)).toBeNull();
      expect(jsQrMock).toHaveBeenCalledTimes(2);
      const [, width, height] = jsQrMock.mock.calls[1];
      expect(width).toBe(400);
      expect(height).toBe(400);
    });

    it('decodes from the upscaled copy when the original fails', () => {
      jsQrMock.mockReturnValueOnce(null).mockReturnValueOnce({ data: 'rounded' });
      const imageData = makeImage(80, 80);

      expect(qrTool.decode(imageData)).toBe('rounded');
      expect(jsQrMock).toHaveBeenCalledTimes(2);
    });

    it('retries with a contrast-normalized copy for low-contrast images', () => {
      jsQrMock.mockReturnValue(null);
      const imageData = makeImage(300, 300, 40, 200);

      expect(qrTool.decode(imageData)).toBeNull();
      expect(jsQrMock.mock.calls.length).toBeGreaterThanOrEqual(4);
      expect(jsQrMock.mock.calls.slice(0, 4).map((call) => call[1])).toEqual([300, 600, 300, 600]);

      const [normalized] = jsQrMock.mock.calls[2];
      const values = Array.from(normalized).filter((_, i) => i % 4 === 0);
      expect(Math.min(...values)).toBe(0);
      expect(Math.max(...values)).toBe(255);
    });

    it('decodes from the contrast-normalized copy when other attempts fail', () => {
      jsQrMock
        .mockReturnValueOnce(null)
        .mockReturnValueOnce(null)
        .mockReturnValueOnce({ data: 'faded' });
      const imageData = makeImage(300, 300, 60, 180);

      expect(qrTool.decode(imageData)).toBe('faded');
      expect(jsQrMock).toHaveBeenCalledTimes(3);
    });

    it('does not upscale large images', () => {
      jsQrMock.mockReturnValue(null);
      const imageData = makeImage(700, 700);

      expect(qrTool.decode(imageData)).toBeNull();
      expect(jsQrMock.mock.calls[0][1]).toBe(700);
      const widths = jsQrMock.mock.calls.map((call) => call[1]);
      expect(Math.max(...widths)).toBeLessThanOrEqual(700);
    });

    it('decodes a QR inside a busy larger image via tile scanning', () => {
      jsQrMock.mockImplementation((_data, width) =>
        width === 180 ? { data: 'tiled' } : null,
      );
      const imageData = makeImage(300, 600);

      expect(qrTool.decode(imageData)).toBe('tiled');
      const tileCalls = jsQrMock.mock.calls.filter((call) => call[1] === 180);
      expect(tileCalls.length).toBeGreaterThanOrEqual(1);
      expect(tileCalls[0][2]).toBe(180);
    });

    it('skips tile scanning when the image is smaller than the minimum tile size', () => {
      jsQrMock.mockReturnValue(null);
      const imageData = makeImage(50, 50);

      expect(qrTool.decode(imageData)).toBeNull();
      expect(jsQrMock).toHaveBeenCalledTimes(2);
    });

    it('pre-scales very large images before tile scanning', () => {
      jsQrMock.mockImplementation((_data, width) =>
        width === 840 ? { data: 'big' } : null,
      );
      const imageData = makeImage(1600, 1600);

      expect(qrTool.decode(imageData)).toBe('big');
      expect(jsQrMock.mock.calls[0][1]).toBe(1600);
      expect(jsQrMock.mock.calls[1][1]).toBe(840);
    });
  });

  describe('fileToImageData', () => {
    let restoreUrls = null;

    afterEach(() => {
      if (restoreUrls) {
        restoreUrls();
        restoreUrls = null;
      }
      vi.unstubAllGlobals();
    });

    function mockCanvas(imageData) {
      const ctx = { drawImage: vi.fn(), getImageData: vi.fn(() => imageData) };
      const spy = vi
        .spyOn(HTMLCanvasElement.prototype, 'getContext')
        .mockReturnValue(ctx);
      return { ctx, restore: () => spy.mockRestore() };
    }

    function stubObjectUrls() {
      const prev = {
        create: URL.createObjectURL,
        revoke: URL.revokeObjectURL,
      };
      URL.createObjectURL = vi.fn(() => 'blob:mock');
      URL.revokeObjectURL = vi.fn();
      restoreUrls = () => {
        URL.createObjectURL = prev.create;
        URL.revokeObjectURL = prev.revoke;
      };
    }

    function stubImageElement({ width = 10, height = 10, fail = false } = {}) {
      const instances = [];
      class FakeImage {
        constructor() {
          this.onload = null;
          this.onerror = null;
          this.naturalWidth = width;
          this.naturalHeight = height;
          instances.push(this);
        }
        set src(_value) {
          queueMicrotask(() => {
            if (fail) this.onerror(new Error('decode failed'));
            else this.onload();
          });
        }
      }
      vi.stubGlobal('Image', FakeImage);
      return instances;
    }

    it('draws the file bitmap onto a canvas and returns its image data', async () => {
      const imageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 };
      const { ctx, restore } = mockCanvas(imageData);
      const bitmap = { width: 1, height: 1, close: vi.fn() };
      const createImageBitmapMock = vi.fn().mockResolvedValue(bitmap);
      vi.stubGlobal('createImageBitmap', createImageBitmapMock);

      const file = new File([new Uint8Array(4)], 'qr.png', { type: 'image/png' });
      const result = await qrTool.fileToImageData(file);

      expect(result).toBe(imageData);
      expect(createImageBitmapMock).toHaveBeenCalledWith(file);
      expect(ctx.drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 1, 1);
      expect(ctx.getImageData).toHaveBeenCalledWith(0, 0, 1, 1);
      expect(bitmap.close).toHaveBeenCalled();

      restore();
    });

    it('falls back to an img element when createImageBitmap rejects', async () => {
      const imageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 };
      const { ctx, restore } = mockCanvas(imageData);
      vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('nope')));
      const images = stubImageElement({ width: 20, height: 30 });
      stubObjectUrls();

      const file = new File([new Uint8Array(4)], 'qr.png', { type: 'image/png' });
      const result = await qrTool.fileToImageData(file);

      expect(result).toBe(imageData);
      expect(ctx.drawImage).toHaveBeenCalledWith(images[0], 0, 0, 20, 30);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');

      restore();
    });

    it('loads via an img element when createImageBitmap is unavailable', async () => {
      const imageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 };
      const { ctx, restore } = mockCanvas(imageData);
      vi.stubGlobal('createImageBitmap', undefined);
      const images = stubImageElement({ width: 40, height: 40 });
      stubObjectUrls();

      const file = new File([new Uint8Array(4)], 'qr.png', { type: 'image/png' });
      await qrTool.fileToImageData(file);

      expect(ctx.drawImage).toHaveBeenCalledWith(images[0], 0, 0, 40, 40);

      restore();
    });

    it('rasterizes SVG files through an img element at a minimum size', async () => {
      const imageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 };
      const { ctx, restore } = mockCanvas(imageData);
      const createImageBitmapMock = vi.fn().mockResolvedValue({ width: 999, height: 999 });
      vi.stubGlobal('createImageBitmap', createImageBitmapMock);
      const images = stubImageElement({ width: 100, height: 100 });
      stubObjectUrls();

      const file = new File(['<svg viewBox="0 0 100 100"/>'], 'qr.svg', {
        type: 'image/svg+xml',
      });
      await qrTool.fileToImageData(file);

      expect(createImageBitmapMock).not.toHaveBeenCalled();
      expect(ctx.drawImage).toHaveBeenCalledWith(images[0], 0, 0, 500, 500);
      expect(ctx.getImageData).toHaveBeenCalledWith(0, 0, 500, 500);

      restore();
    });

    it('uses a fallback size when the image reports no intrinsic dimensions', async () => {
      const imageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 };
      const { ctx, restore } = mockCanvas(imageData);
      vi.stubGlobal('createImageBitmap', undefined);
      const images = stubImageElement({ width: 0, height: 0 });
      stubObjectUrls();

      const file = new File(['<svg viewBox="0 0 10 10"/>'], 'qr.svg', {
        type: 'image/svg+xml',
      });
      await qrTool.fileToImageData(file);

      expect(ctx.drawImage).toHaveBeenCalledWith(images[0], 0, 0, 1000, 1000);
      expect(ctx.getImageData).toHaveBeenCalledWith(0, 0, 1000, 1000);

      restore();
    });

    it('rejects when both bitmap decoding and image loading fail', async () => {
      vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('bad file')));
      stubImageElement({ fail: true });
      stubObjectUrls();

      const file = new File([new Uint8Array(4)], 'broken.png', { type: 'image/png' });
      await expect(qrTool.fileToImageData(file)).rejects.toThrow('Unsupported image format');
    });
  });
});
