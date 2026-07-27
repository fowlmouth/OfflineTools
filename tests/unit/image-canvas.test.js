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
