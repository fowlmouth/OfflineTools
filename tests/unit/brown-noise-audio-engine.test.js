import { describe, it, expect, vi } from 'vitest';
import { createBrownNoiseEngine } from '../../src/tools/brown-noise/audio-engine.js';

function createMockAudioContext(sampleRate = 44100) {
  const sources = [];
  const gains = [];
  const filters = [];
  const connections = [];
  const ctx = {
    sampleRate,
    destination: { id: 'destination' },
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
    createBuffer: vi.fn((channels, length, sr) => ({
      numberOfChannels: channels,
      length,
      sampleRate: sr,
      getChannelData: vi.fn(() => new Float32Array(length)),
    })),
    createBufferSource: vi.fn(() => {
      const src = {
        buffer: null,
        loop: false,
        playbackRate: { value: 1, setValueAtTime: vi.fn() },
        connect: vi.fn((node) => connections.push({ from: src, to: node })),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        onended: null,
      };
      sources.push(src);
      return src;
    }),
    createGain: vi.fn(() => {
      const gain = {
        gain: { value: 1, setValueAtTime: vi.fn() },
        connect: vi.fn((node) => connections.push({ from: gain, to: node })),
        disconnect: vi.fn(),
      };
      gains.push(gain);
      return gain;
    }),
    createBiquadFilter: vi.fn(() => {
      const filter = {
        type: 'lowpass',
        frequency: { value: 350, setValueAtTime: vi.fn() },
        Q: { value: 1 },
        connect: vi.fn((node) => connections.push({ from: filter, to: node })),
        disconnect: vi.fn(),
      };
      filters.push(filter);
      return filter;
    }),
  };
  ctx._sources = sources;
  ctx._gains = gains;
  ctx._filters = filters;
  ctx._connections = connections;
  return ctx;
}

describe('createBrownNoiseEngine', () => {
  it('creates an audio buffer sized for the requested duration', () => {
    const ctx = createMockAudioContext(44100);
    createBrownNoiseEngine(ctx, { seconds: 2 });

    expect(ctx.createBuffer).toHaveBeenCalledWith(1, 44100 * 2, 44100);
  });

  it('uses a default duration of 4 seconds when none given', () => {
    const ctx = createMockAudioContext(8000);
    createBrownNoiseEngine(ctx);

    expect(ctx.createBuffer).toHaveBeenCalledWith(1, 8000 * 4, 8000);
  });

  it('fills the buffer with brown noise samples', () => {
    const ctx = createMockAudioContext(44100);
    createBrownNoiseEngine(ctx, { seconds: 1 });

    const buffer = ctx.createBuffer.mock.results[0].value;
    const data = buffer.getChannelData.mock.results[0].value;
    expect(data.length).toBe(44100);
    for (let i = 0; i < data.length; i++) {
      expect(data[i]).toBeGreaterThanOrEqual(-1);
      expect(data[i]).toBeLessThanOrEqual(1);
    }
  });

  it('creates a single persistent gain node', () => {
    const ctx = createMockAudioContext();
    createBrownNoiseEngine(ctx);

    expect(ctx.createGain).toHaveBeenCalledTimes(1);
  });

  it('connects gain node to destination on creation', () => {
    const ctx = createMockAudioContext();
    createBrownNoiseEngine(ctx);

    const gain = ctx._gains[0];
    expect(gain.connect).toHaveBeenCalledWith(ctx.destination);
  });

  it('is not playing initially', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);

    expect(engine.isPlaying()).toBe(false);
  });

  it('play() creates a looping source connected to the filter and starts it', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);

    engine.play();

    expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);
    const source = ctx._sources[0];
    expect(source.loop).toBe(true);
    expect(source.buffer).toBeDefined();
    expect(source.connect).toHaveBeenCalledWith(ctx._filters[0]);
    expect(source.start).toHaveBeenCalledTimes(1);
    expect(engine.isPlaying()).toBe(true);
  });

  it('resume() is called on play to satisfy autoplay policies', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);

    engine.play();

    expect(ctx.resume).toHaveBeenCalledTimes(1);
  });

  it('stop() stops the current source', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);
    engine.play();

    engine.stop();

    expect(ctx._sources[0].stop).toHaveBeenCalledTimes(1);
    expect(engine.isPlaying()).toBe(false);
  });

  it('stop() is a no-op when not playing', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);

    expect(() => engine.stop()).not.toThrow();
    expect(ctx._sources.length).toBe(0);
  });

  it('play() after stop() creates a fresh source node', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);
    engine.play();
    engine.stop();

    engine.play();

    expect(ctx.createBufferSource).toHaveBeenCalledTimes(2);
    expect(ctx._sources[1].start).toHaveBeenCalledTimes(1);
    expect(engine.isPlaying()).toBe(true);
  });

  it('play() while already playing is a no-op', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);
    engine.play();

    engine.play();

    expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);
  });

  it('setVolume() updates the gain value', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);

    engine.setVolume(0.25);

    expect(ctx._gains[0].gain.value).toBe(0.25);
  });

  it('setVolume() clamps values to [0, 1]', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);

    engine.setVolume(5);
    expect(ctx._gains[0].gain.value).toBe(1);

    engine.setVolume(-1);
    expect(ctx._gains[0].gain.value).toBe(0);
  });

  it('default volume is 0.5', () => {
    const ctx = createMockAudioContext();
    createBrownNoiseEngine(ctx);

    expect(ctx._gains[0].gain.value).toBe(0.5);
  });

  it('custom initial volume is applied', () => {
    const ctx = createMockAudioContext();
    createBrownNoiseEngine(ctx, { volume: 0.8 });

    expect(ctx._gains[0].gain.value).toBe(0.8);
  });

  it('dispose() stops playback and disconnects the gain node', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);
    engine.play();

    engine.dispose();

    expect(ctx._sources[0].stop).toHaveBeenCalledTimes(1);
    expect(ctx._gains[0].disconnect).toHaveBeenCalledTimes(1);
    expect(engine.isPlaying()).toBe(false);
  });

  it('dispose() is safe to call when not playing', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);

    expect(() => engine.dispose()).not.toThrow();
    expect(ctx._gains[0].disconnect).toHaveBeenCalledTimes(1);
  });

  it('creates a lowpass biquad filter on construction', () => {
    const ctx = createMockAudioContext();
    createBrownNoiseEngine(ctx);

    expect(ctx.createBiquadFilter).toHaveBeenCalledTimes(1);
    expect(ctx._filters[0].type).toBe('lowpass');
  });

  it('connects the signal chain source -> filter -> gain -> destination', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);

    const filter = ctx._filters[0];
    const gain = ctx._gains[0];
    expect(filter.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(ctx.destination);

    engine.play();
    expect(ctx._sources[0].connect).toHaveBeenCalledWith(filter);
  });

  it('defaults the filter cutoff to the Nyquist frequency (transparent)', () => {
    const ctx = createMockAudioContext(44100);
    createBrownNoiseEngine(ctx);

    expect(ctx._filters[0].frequency.value).toBe(22050);
  });

  it('applies a custom initial filter cutoff', () => {
    const ctx = createMockAudioContext(44100);
    createBrownNoiseEngine(ctx, { filterCutoff: 800 });

    expect(ctx._filters[0].frequency.value).toBe(800);
  });

  it('setFilterCutoff updates the filter frequency', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);

    engine.setFilterCutoff(1200);
    expect(ctx._filters[0].frequency.value).toBe(1200);
  });

  it('setFilterCutoff clamps to the valid range [0, Nyquist]', () => {
    const ctx = createMockAudioContext(44100);
    const engine = createBrownNoiseEngine(ctx);

    engine.setFilterCutoff(999999);
    expect(ctx._filters[0].frequency.value).toBe(22050);

    engine.setFilterCutoff(-50);
    expect(ctx._filters[0].frequency.value).toBe(0);
  });

  it('defaults playback rate to 1', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);

    engine.play();
    expect(ctx._sources[0].playbackRate.value).toBe(1);
  });

  it('applies a custom initial playback rate on play', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx, { playbackRate: 0.75 });

    engine.play();
    expect(ctx._sources[0].playbackRate.value).toBe(0.75);
  });

  it('setPlaybackRate updates a live source immediately', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);
    engine.play();

    engine.setPlaybackRate(1.5);
    expect(ctx._sources[0].playbackRate.value).toBe(1.5);
  });

  it('setPlaybackRate applies to the next source when not playing', () => {
    const ctx = createMockAudioContext();
    const engine = createBrownNoiseEngine(ctx);

    engine.setPlaybackRate(0.5);
    engine.play();
    expect(ctx._sources[0].playbackRate.value).toBe(0.5);
  });
});
