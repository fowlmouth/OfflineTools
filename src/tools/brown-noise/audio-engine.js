import { generateBrownNoise } from './generator.js';

const DEFAULT_SECONDS = 4;
const DEFAULT_VOLUME = 0.5;
const DEFAULT_PLAYBACK_RATE = 1;

export function createBrownNoiseEngine(audioContext, options = {}) {
  const sampleRate = audioContext.sampleRate;
  const nyquist = sampleRate / 2;
  const seconds = options.seconds ?? DEFAULT_SECONDS;
  const initialVolume = clamp(options.volume ?? DEFAULT_VOLUME, 0, 1);
  const initialCutoff = clamp(options.filterCutoff ?? nyquist, 0, nyquist);
  const playbackRateRef = { value: options.playbackRate ?? DEFAULT_PLAYBACK_RATE };

  const length = Math.max(0, Math.floor(sampleRate * seconds));
  const buffer = audioContext.createBuffer(1, length, sampleRate);
  buffer.getChannelData(0).set(generateBrownNoise(length));

  const filterNode = audioContext.createBiquadFilter();
  filterNode.type = 'lowpass';
  filterNode.frequency.value = initialCutoff;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = initialVolume;

  filterNode.connect(gainNode);
  gainNode.connect(audioContext.destination);

  let sourceNode = null;
  let playing = false;

  function play() {
    if (playing) return;
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = buffer;
    sourceNode.loop = true;
    sourceNode.playbackRate.value = playbackRateRef.value;
    sourceNode.connect(filterNode);
    sourceNode.start();
    playing = true;
    audioContext.resume?.();
  }

  function stop() {
    if (!playing || !sourceNode) return;
    sourceNode.stop();
    sourceNode = null;
    playing = false;
  }

  function setVolume(value) {
    gainNode.gain.value = clamp(value, 0, 1);
  }

  function setFilterCutoff(hz) {
    filterNode.frequency.value = clamp(hz, 0, nyquist);
  }

  function setPlaybackRate(rate) {
    playbackRateRef.value = rate;
    if (sourceNode) {
      sourceNode.playbackRate.value = rate;
    }
  }

  function dispose() {
    stop();
    filterNode.disconnect();
    gainNode.disconnect();
  }

  function isPlaying() {
    return playing;
  }

  return { play, stop, setVolume, setFilterCutoff, setPlaybackRate, dispose, isPlaying };
}

function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}
