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
