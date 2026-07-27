import { fileToImage, revokeObjectURL } from './load.js';
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
} from './canvas.js';

export {
  fileToImage,
  revokeObjectURL,
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
};

export default {
  loadImage: fileToImage,
  revokeObjectURL,
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
};
