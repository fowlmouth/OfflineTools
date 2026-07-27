import { fileToImage, revokeObjectURL } from './load.js';
import { createCanvas, get2dContext, drawImageTo, clearCanvas } from './canvas.js';

export {
  fileToImage,
  revokeObjectURL,
  createCanvas,
  get2dContext,
  drawImageTo,
  clearCanvas,
};

export default {
  loadImage: fileToImage,
  revokeObjectURL,
  createCanvas,
  get2dContext,
  drawImageTo,
  clearCanvas,
};
