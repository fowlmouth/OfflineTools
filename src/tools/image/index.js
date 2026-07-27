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
  exportBlob,
} from './canvas.js';

const FORMATS = ['image/png', 'image/jpeg', 'image/webp'];

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
  exportBlob,
  FORMATS,
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
  export: exportBlob,
  FORMATS,
};
