export function degreesToRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function aspectRatio(width, height) {
  if (height === 0) throw new Error('Cannot compute aspect ratio with zero height');
  return width / height;
}

export function scaleToWidth({ width, height, newWidth }) {
  return {
    width: newWidth,
    height: Math.round(newWidth / aspectRatio(width, height)),
  };
}

export function scaleToHeight({ width, height, newHeight }) {
  return {
    width: Math.round(newHeight * aspectRatio(width, height)),
    height: newHeight,
  };
}

export function containDimensions({ width, height, maxWidth, maxHeight }) {
  const ratio = aspectRatio(width, height);
  const byWidth = { width: maxWidth, height: Math.round(maxWidth / ratio) };
  if (byWidth.height <= maxHeight) return byWidth;
  return { width: Math.round(maxHeight * ratio), height: maxHeight };
}

export function fitResize({ width, height, targetWidth, targetHeight, lock = true }) {
  if (!lock) return { width: targetWidth, height: targetHeight };
  if (targetWidth != null && targetHeight != null) {
    return containDimensions({ width, height, maxWidth: targetWidth, maxHeight: targetHeight });
  }
  if (targetWidth != null) return scaleToWidth({ width, height, newWidth: targetWidth });
  if (targetHeight != null) return scaleToHeight({ width, height, newHeight: targetHeight });
  return { width, height };
}

export function rotateDimensions({ width, height, degrees }) {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized === 90 || normalized === 270) return { width: height, height: width };
  return { width, height };
}

export function clampCrop({ x, y, width, height, sourceWidth, sourceHeight }) {
  const clampedX = Math.max(0, Math.min(x, sourceWidth));
  const clampedY = Math.max(0, Math.min(y, sourceHeight));
  const clampedWidth = Math.max(0, Math.min(width, sourceWidth - clampedX));
  const clampedHeight = Math.max(0, Math.min(height, sourceHeight - clampedY));
  return { x: clampedX, y: clampedY, width: clampedWidth, height: clampedHeight };
}
