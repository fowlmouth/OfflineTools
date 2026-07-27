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
};
