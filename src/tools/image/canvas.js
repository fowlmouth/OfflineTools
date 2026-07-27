import { degreesToRadians, rotateBoundingBox, fitResize, clampCrop } from './geometry.js';

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function get2dContext(canvas) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to acquire 2D canvas context');
  return ctx;
}

export function drawImageTo(targetCanvas, source, dx = 0, dy = 0) {
  const ctx = get2dContext(targetCanvas);
  ctx.drawImage(source, dx, dy);
  return targetCanvas;
}

export function clearCanvas(canvas) {
  const ctx = get2dContext(canvas);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

export function flip(canvas, axis) {
  const { width, height } = canvas;
  const out = createCanvas(width, height);
  const ctx = get2dContext(out);
  ctx.save();
  if (axis === 'horizontal') {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  } else if (axis === 'vertical') {
    ctx.translate(0, height);
    ctx.scale(1, -1);
  } else {
    throw new Error(`Invalid flip axis: ${axis}`);
  }
  ctx.drawImage(canvas, 0, 0);
  ctx.restore();
  return out;
}

export function rotate(canvas, degrees) {
  const { width, height } = canvas;
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized === 0) {
    const out = createCanvas(width, height);
    drawImageTo(out, canvas);
    return out;
  }
  const dims = rotateBoundingBox({ width, height, degrees: normalized });
  const out = createCanvas(dims.width, dims.height);
  const ctx = get2dContext(out);
  ctx.save();
  ctx.translate(dims.width / 2, dims.height / 2);
  ctx.rotate(degreesToRadians(normalized));
  ctx.drawImage(canvas, -width / 2, -height / 2);
  ctx.restore();
  return out;
}

export function resize(canvas, { width: targetWidth, height: targetHeight, lock = true }) {
  const dims = fitResize({
    width: canvas.width,
    height: canvas.height,
    targetWidth,
    targetHeight,
    lock,
  });
  const out = createCanvas(dims.width, dims.height);
  const ctx = get2dContext(out);
  ctx.drawImage(canvas, 0, 0, dims.width, dims.height);
  return out;
}

export function crop(canvas, { x, y, width, height }) {
  const region = clampCrop({
    x,
    y,
    width,
    height,
    sourceWidth: canvas.width,
    sourceHeight: canvas.height,
  });
  const out = createCanvas(region.width, region.height);
  const ctx = get2dContext(out);
  ctx.drawImage(
    canvas,
    region.x,
    region.y,
    region.width,
    region.height,
    0,
    0,
    region.width,
    region.height,
  );
  return out;
}
