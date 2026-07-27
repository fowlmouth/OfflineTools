import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCanvas,
  get2dContext,
  drawImageTo,
  clearCanvas,
  flip,
  rotate,
  resize,
  crop,
  drawText,
  applyFilters,
  exportBlob,
} from '../../src/tools/image/canvas.js';

function makeFakeCtx() {
  return {
    drawImage: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    font: '',
    fillStyle: '',
    textBaseline: '',
    filter: '',
  };
}

function mockContext(ctx) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('createCanvas', () => {
  it('creates a canvas element with the given width and height', () => {
    const canvas = createCanvas(200, 100);
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(100);
  });
});

describe('get2dContext', () => {
  it('returns the 2d context from the canvas', () => {
    const fakeCtx = { drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx);
    const canvas = createCanvas(10, 10);
    expect(get2dContext(canvas)).toBe(fakeCtx);
    expect(canvas.getContext).toHaveBeenCalledWith('2d');
  });

  it('throws when the 2d context is unavailable', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    const canvas = createCanvas(10, 10);
    expect(() => get2dContext(canvas)).toThrow();
  });
});

describe('drawImageTo', () => {
  it('draws the source onto the target canvas at the given position', () => {
    const fakeCtx = { drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx);
    const canvas = createCanvas(100, 100);
    const source = { tag: 'fake-image' };
    drawImageTo(canvas, source, 5, 10);
    expect(fakeCtx.drawImage).toHaveBeenCalledWith(source, 5, 10);
  });

  it('defaults dx and dy to zero', () => {
    const fakeCtx = { drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx);
    const canvas = createCanvas(100, 100);
    drawImageTo(canvas, {});
    expect(fakeCtx.drawImage).toHaveBeenCalledWith({}, 0, 0);
  });

  it('returns the target canvas', () => {
    const fakeCtx = { drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx);
    const canvas = createCanvas(100, 100);
    expect(drawImageTo(canvas, {})).toBe(canvas);
  });
});

describe('clearCanvas', () => {
  it('clears the full canvas area', () => {
    const fakeCtx = { clearRect: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx);
    const canvas = createCanvas(300, 200);
    clearCanvas(canvas);
    expect(fakeCtx.clearRect).toHaveBeenCalledWith(0, 0, 300, 200);
  });

  it('returns the canvas', () => {
    const fakeCtx = { clearRect: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx);
    const canvas = createCanvas(300, 200);
    expect(clearCanvas(canvas)).toBe(canvas);
  });
});

describe('flip', () => {
  it('flips horizontally using translate(width,0) and scale(-1,1)', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(200, 100);
    flip(source, 'horizontal');
    expect(ctx.translate).toHaveBeenCalledWith(200, 0);
    expect(ctx.scale).toHaveBeenCalledWith(-1, 1);
    expect(ctx.drawImage).toHaveBeenCalledWith(source, 0, 0);
  });

  it('flips vertically using translate(0,height) and scale(1,-1)', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(200, 100);
    flip(source, 'vertical');
    expect(ctx.translate).toHaveBeenCalledWith(0, 100);
    expect(ctx.scale).toHaveBeenCalledWith(1, -1);
    expect(ctx.drawImage).toHaveBeenCalledWith(source, 0, 0);
  });

  it('wraps the transform in save and restore', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(200, 100);
    flip(source, 'horizontal');
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });

  it('throws for an invalid axis', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(200, 100);
    expect(() => flip(source, 'diagonal')).toThrow();
  });

  it('returns a new canvas with the same dimensions', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(200, 100);
    const result = flip(source, 'horizontal');
    expect(result).not.toBe(source);
    expect(result.width).toBe(200);
    expect(result.height).toBe(100);
  });
});

describe('rotate', () => {
  it('returns a copy without rotating for 0 degrees', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(200, 100);
    const result = rotate(source, 0);
    expect(result).not.toBe(source);
    expect(result.width).toBe(200);
    expect(result.height).toBe(100);
    expect(ctx.drawImage).toHaveBeenCalledWith(source, 0, 0);
    expect(ctx.rotate).not.toHaveBeenCalled();
  });

  it('rotates 90 degrees with swapped canvas dimensions', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(200, 100);
    const result = rotate(source, 90);
    expect(result.width).toBe(100);
    expect(result.height).toBe(200);
    expect(ctx.translate).toHaveBeenCalledWith(50, 100);
    expect(ctx.rotate).toHaveBeenCalledTimes(1);
    expect(ctx.drawImage).toHaveBeenCalledWith(source, -100, -50);
  });

  it('rotates 180 degrees keeping the same canvas dimensions', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(200, 100);
    const result = rotate(source, 180);
    expect(result.width).toBe(200);
    expect(result.height).toBe(100);
    expect(ctx.translate).toHaveBeenCalledWith(100, 50);
    expect(ctx.rotate).toHaveBeenCalledTimes(1);
    expect(ctx.drawImage).toHaveBeenCalledWith(source, -100, -50);
  });

  it('rotates 270 degrees with swapped canvas dimensions', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(200, 100);
    const result = rotate(source, 270);
    expect(result.width).toBe(100);
    expect(result.height).toBe(200);
    expect(ctx.translate).toHaveBeenCalledWith(50, 100);
    expect(ctx.rotate).toHaveBeenCalledTimes(1);
  });

  it('rotates an arbitrary angle into a larger bounding box', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(100, 100);
    const result = rotate(source, 45);
    expect(result.width).toBe(141);
    expect(result.height).toBe(141);
    expect(ctx.translate).toHaveBeenCalledWith(70.5, 70.5);
    expect(ctx.rotate).toHaveBeenCalledTimes(1);
  });

  it('normalizes negative degrees', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(200, 100);
    const result = rotate(source, -90);
    expect(result.width).toBe(100);
    expect(result.height).toBe(200);
    expect(ctx.rotate).toHaveBeenCalledTimes(1);
  });

  it('wraps the transform in save and restore', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(200, 100);
    rotate(source, 90);
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });
});

describe('resize', () => {
  it('draws the source scaled to the target dimensions when lock is false', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(800, 600);
    const result = resize(source, { width: 400, height: 200, lock: false });
    expect(result.width).toBe(400);
    expect(result.height).toBe(200);
    expect(ctx.drawImage).toHaveBeenCalledWith(source, 0, 0, 400, 200);
  });

  it('preserves aspect ratio when lock is true and only width is given', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(800, 600);
    const result = resize(source, { width: 400, lock: true });
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
    expect(ctx.drawImage).toHaveBeenCalledWith(source, 0, 0, 400, 300);
  });

  it('preserves aspect ratio when lock is true and both targets are given', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(800, 600);
    const result = resize(source, { width: 400, height: 400, lock: true });
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
    expect(ctx.drawImage).toHaveBeenCalledWith(source, 0, 0, 400, 300);
  });

  it('defaults lock to true', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(800, 600);
    const result = resize(source, { width: 400 });
    expect(result.height).toBe(300);
  });

  it('returns a new canvas distinct from the source', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(800, 600);
    const result = resize(source, { width: 400, lock: false });
    expect(result).not.toBe(source);
  });
});

describe('crop', () => {
  it('draws the requested sub-region into a new canvas', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(800, 600);
    const result = crop(source, { x: 10, y: 20, width: 100, height: 50 });
    expect(result.width).toBe(100);
    expect(result.height).toBe(50);
    expect(ctx.drawImage).toHaveBeenCalledWith(source, 10, 20, 100, 50, 0, 0, 100, 50);
  });

  it('clamps the crop region to source bounds', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(800, 600);
    const result = crop(source, { x: 750, y: 0, width: 200, height: 100 });
    expect(result.width).toBe(50);
    expect(result.height).toBe(100);
    expect(ctx.drawImage).toHaveBeenCalledWith(source, 750, 0, 50, 100, 0, 0, 50, 100);
  });

  it('clamps negative origin to zero', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(800, 600);
    const result = crop(source, { x: -50, y: -50, width: 100, height: 100 });
    expect(result.width).toBe(100);
    expect(result.height).toBe(100);
    expect(ctx.drawImage).toHaveBeenCalledWith(source, 0, 0, 100, 100, 0, 0, 100, 100);
  });

  it('returns a new canvas distinct from the source', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(800, 600);
    const result = crop(source, { x: 0, y: 0, width: 100, height: 100 });
    expect(result).not.toBe(source);
  });
});

describe('drawText', () => {
  it('copies the source canvas then draws the text on top', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(400, 300);
    drawText(source, { text: 'Hello', x: 10, y: 20 });
    // first draw is the underlying canvas copy
    expect(ctx.drawImage).toHaveBeenNthCalledWith(1, source, 0, 0);
    expect(ctx.fillText).toHaveBeenCalledWith('Hello', 10, 20);
  });

  it('sets the font string from size and font family', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(400, 300);
    drawText(source, { text: 'Hi', size: 48, font: 'monospace' });
    expect(ctx.font).toBe('48px monospace');
  });

  it('defaults size to 32 and font to sans-serif', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(400, 300);
    drawText(source, { text: 'Hi' });
    expect(ctx.font).toBe('32px sans-serif');
  });

  it('sets the fill style to the given color', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(400, 300);
    drawText(source, { text: 'Hi', color: '#ff0000' });
    expect(ctx.fillStyle).toBe('#ff0000');
  });

  it('anchors text at the top-left padding when position is omitted', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(400, 300);
    drawText(source, { text: 'Hi', padding: 24 });
    expect(ctx.fillText).toHaveBeenCalledWith('Hi', 24, 24);
  });

  it('uses a default padding of 16 when neither position nor padding is given', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(400, 300);
    drawText(source, { text: 'Hi' });
    expect(ctx.fillText).toHaveBeenCalledWith('Hi', 16, 16);
  });

  it('sets textBaseline to top so the anchor is the upper-left of the glyphs', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(400, 300);
    drawText(source, { text: 'Hi' });
    expect(ctx.textBaseline).toBe('top');
  });

  it('wraps the text style changes in save and restore', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(400, 300);
    drawText(source, { text: 'Hi' });
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });

  it('does not render text when the text value is empty', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(400, 300);
    drawText(source, { text: '' });
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('returns a new canvas with the same dimensions as the source', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(400, 300);
    const result = drawText(source, { text: 'Hi' });
    expect(result).not.toBe(source);
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
  });
});

describe('applyFilters', () => {
  it('copies the source onto a new canvas', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(500, 400);
    applyFilters(source, { brightness: 1.5 });
    expect(ctx.drawImage).toHaveBeenCalledWith(source, 0, 0);
  });

  it('builds a brightness() filter from the brightness option', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(500, 400);
    applyFilters(source, { brightness: 1.5 });
    expect(ctx.filter).toBe('brightness(1.5)');
  });

  it('builds a contrast() filter from the contrast option', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(500, 400);
    applyFilters(source, { contrast: 1.2 });
    expect(ctx.filter).toBe('contrast(1.2)');
  });

  it('builds a grayscale() filter from the grayscale option', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(500, 400);
    applyFilters(source, { grayscale: 0.5 });
    expect(ctx.filter).toBe('grayscale(0.5)');
  });

  it('builds a saturate() filter from the saturate option', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(500, 400);
    applyFilters(source, { saturate: 2 });
    expect(ctx.filter).toBe('saturate(2)');
  });

  it('combines multiple filters into a single space-separated string', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(500, 400);
    applyFilters(source, { brightness: 1.1, contrast: 1.3, grayscale: 0, saturate: 1.5 });
    expect(ctx.filter).toBe('brightness(1.1) contrast(1.3) grayscale(0) saturate(1.5)');
  });

  it('omits filters that are not provided', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(500, 400);
    applyFilters(source, { brightness: 1.5, saturate: 1.2 });
    expect(ctx.filter).toBe('brightness(1.5) saturate(1.2)');
  });

  it('leaves ctx.filter as none when no filters are provided', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(500, 400);
    applyFilters(source, {});
    expect(ctx.filter).toBe('');
  });

  it('supports blur as a radius in px', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(500, 400);
    applyFilters(source, { blur: 4 });
    expect(ctx.filter).toBe('blur(4px)');
  });

  it('supports sepia and hue-rotate filters', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(500, 400);
    applyFilters(source, { sepia: 0.6, hueRotate: 90 });
    expect(ctx.filter).toBe('sepia(0.6) hue-rotate(90deg)');
  });

  it('wraps the filter draw in save and restore', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(500, 400);
    applyFilters(source, { brightness: 1.5 });
    expect(ctx.save).toHaveBeenCalledTimes(1);
    expect(ctx.restore).toHaveBeenCalledTimes(1);
  });

  it('returns a new canvas with the same dimensions as the source', () => {
    const ctx = makeFakeCtx();
    mockContext(ctx);
    const source = createCanvas(500, 400);
    const result = applyFilters(source, { brightness: 1.5 });
    expect(result).not.toBe(source);
    expect(result.width).toBe(500);
    expect(result.height).toBe(400);
  });
});

describe('exportBlob', () => {
  it('calls canvas.toBlob with the default PNG type', async () => {
    const blob = new Blob([new Uint8Array([0])], { type: 'image/png' });
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');
    toBlob.mockImplementation((cb) => cb(blob));

    const canvas = createCanvas(100, 100);
    await exportBlob(canvas);
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/png', undefined);
  });

  it('accepts a custom image type', async () => {
    const blob = new Blob([new Uint8Array([0])], { type: 'image/jpeg' });
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');
    toBlob.mockImplementation((cb) => cb(blob));

    const canvas = createCanvas(100, 100);
    await exportBlob(canvas, { type: 'image/jpeg' });
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', undefined);
  });

  it('passes quality for lossy jpeg exports', async () => {
    const blob = new Blob([new Uint8Array([0])], { type: 'image/jpeg' });
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');
    toBlob.mockImplementation((cb) => cb(blob));

    const canvas = createCanvas(100, 100);
    await exportBlob(canvas, { type: 'image/jpeg', quality: 0.8 });
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', 0.8);
  });

  it('passes quality for lossy webp exports', async () => {
    const blob = new Blob([new Uint8Array([0])], { type: 'image/webp' });
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');
    toBlob.mockImplementation((cb) => cb(blob));

    const canvas = createCanvas(100, 100);
    await exportBlob(canvas, { type: 'image/webp', quality: 0.9 });
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/webp', 0.9);
  });

  it('omits quality when not provided', async () => {
    const blob = new Blob([new Uint8Array([0])], { type: 'image/jpeg' });
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob');
    toBlob.mockImplementation((cb) => cb(blob));

    const canvas = createCanvas(100, 100);
    await exportBlob(canvas, { type: 'image/jpeg' });
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', undefined);
  });

  it('resolves with the blob produced by toBlob', async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: 'image/png' });
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(blob));

    const canvas = createCanvas(100, 100);
    const result = await exportBlob(canvas);
    expect(result).toBe(blob);
  });

  it('rejects when toBlob produces null', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((cb) => cb(null));

    const canvas = createCanvas(100, 100);
    await expect(exportBlob(canvas)).rejects.toThrow();
  });
});
