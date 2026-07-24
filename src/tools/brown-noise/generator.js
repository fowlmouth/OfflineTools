/**
 * Brown noise sample generator.
 *
 * Brown (red) noise has a power spectrum that falls at 6 dB/octave — it is
 * produced by integrating white noise. We use a leaky integrator so the signal
 * remains bounded without biasing the long-term average.
 *
 * The `random` parameter is injectable so tests can produce deterministic
 * output. It defaults to Math.random.
 */

const STEP = 0.02;
const LEAK = 1.02;
const GAIN = 3.5;

export function generateBrownNoise(length, options = {}) {
  const random = options.random ?? Math.random;
  const output = new Float32Array(length);
  let last = 0;

  for (let i = 0; i < length; i++) {
    const white = random() * 2 - 1;
    last = (last + STEP * white) / LEAK;
    const sample = last * GAIN;
    output[i] = sample > 1 ? 1 : sample < -1 ? -1 : sample;
  }

  return output;
}
