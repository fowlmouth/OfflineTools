import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createCanvas,
  get2dContext,
  drawImageTo,
  clearCanvas,
} from '../../src/tools/image/canvas.js';

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
