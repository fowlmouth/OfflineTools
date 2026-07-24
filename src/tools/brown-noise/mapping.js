export const CUTOFF_MIN = 50;
export const CUTOFF_MAX = 20000;

export function sliderToCutoff(t) {
  const clamped = t < 0 ? 0 : t > 1 ? 1 : t;
  return CUTOFF_MIN * Math.pow(CUTOFF_MAX / CUTOFF_MIN, clamped);
}

export function cutoffToSlider(hz) {
  return Math.log(hz / CUTOFF_MIN) / Math.log(CUTOFF_MAX / CUTOFF_MIN);
}
