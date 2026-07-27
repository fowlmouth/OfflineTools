import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('image tool load module', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  function installMockImage({ naturalWidth = 800, naturalHeight = 600, fail = false } = {}) {
    class MockImage {
      constructor() {
        this.naturalWidth = naturalWidth;
        this.naturalHeight = naturalHeight;
      }
      set src(value) {
        this._src = value;
        queueMicrotask(() => {
          if (fail && typeof this.onerror === 'function') this.onerror(new Error('load failed'));
          else if (!fail && typeof this.onload === 'function') this.onload();
        });
      }
      get src() { return this._src; }
    }
    vi.stubGlobal('Image', MockImage);
  }

  it('rejects a non-image file type', async () => {
    const { fileToImage } = await import('../../src/tools/image/load.js');
    const file = new File(['text'], 'note.txt', { type: 'text/plain' });
    await expect(fileToImage(file)).rejects.toThrow();
  });

  it('rejects when no file is provided', async () => {
    const { fileToImage } = await import('../../src/tools/image/load.js');
    await expect(fileToImage(null)).rejects.toThrow();
  });

  it('creates an object URL and resolves with image, dimensions, and url', async () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    installMockImage();

    const { fileToImage } = await import('../../src/tools/image/load.js');
    const file = new File([new Uint8Array([1, 2, 3])], 'pic.png', { type: 'image/png' });

    const result = await fileToImage(file);
    expect(createObjectURL).toHaveBeenCalledWith(file);
    expect(result.url).toBe('blob:mock-url');
    expect(result.width).toBe(800);
    expect(result.height).toBe(600);
    expect(result.image).toBeInstanceOf(Image);
  });

  it('revokes the object URL when the image fails to load', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL');
    installMockImage({ fail: true });

    const { fileToImage } = await import('../../src/tools/image/load.js');
    const file = new File([new Uint8Array([1])], 'broken.png', { type: 'image/png' });

    await expect(fileToImage(file)).rejects.toThrow('Failed to load image');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});

describe('image tool aggregator', () => {
  it('exposes loadImage, createCanvas, get2dContext, drawImageTo, clearCanvas as methods', async () => {
    const api = (await import('../../src/tools/image/index.js')).default;
    expect(typeof api.loadImage).toBe('function');
    expect(typeof api.createCanvas).toBe('function');
    expect(typeof api.get2dContext).toBe('function');
    expect(typeof api.drawImageTo).toBe('function');
    expect(typeof api.clearCanvas).toBe('function');
  });

  it('exposes flip, rotate, resize, crop transformation methods', async () => {
    const api = (await import('../../src/tools/image/index.js')).default;
    expect(typeof api.flip).toBe('function');
    expect(typeof api.rotate).toBe('function');
    expect(typeof api.resize).toBe('function');
    expect(typeof api.crop).toBe('function');
  });
});
