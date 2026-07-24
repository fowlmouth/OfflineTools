import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/preact';
import { useBrownNoise } from '../../src/hooks/useBrownNoise.js';
import { CUTOFF_MAX } from '../../src/tools/brown-noise/mapping.js';

function createMockAudioContext(sampleRate = 44100) {
  const sources = [];
  const gains = [];
  const filters = [];
  const ctx = {
    sampleRate,
    destination: { id: 'destination' },
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
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
        connect: vi.fn(),
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
        connect: vi.fn(),
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
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      filters.push(filter);
      return filter;
    }),
  };
  ctx._sources = sources;
  ctx._gains = gains;
  ctx._filters = filters;
  return ctx;
}

function renderNoiseHook(options = {}) {
  const ctx = createMockAudioContext();
  const createAudioContext = vi.fn(() => ctx);
  const result = renderHook(() => useBrownNoise({ createAudioContext, ...options }));
  return { ...result, ctx, createAudioContext };
}

describe('useBrownNoise', () => {
  it('is not playing initially', () => {
    const { result } = renderNoiseHook();
    expect(result.current.isPlaying).toBe(false);
  });

  it('has a default volume of 0.5', () => {
    const { result } = renderNoiseHook();
    expect(result.current.volume).toBe(0.5);
  });

  it('does not create an AudioContext until play is called', () => {
    const { createAudioContext } = renderNoiseHook();
    expect(createAudioContext).not.toHaveBeenCalled();
  });

  it('play() sets isPlaying to true', () => {
    const { result } = renderNoiseHook();
    act(() => {
      result.current.play();
    });
    expect(result.current.isPlaying).toBe(true);
  });

  it('play() creates an AudioContext lazily', () => {
    const { result, createAudioContext } = renderNoiseHook();
    act(() => {
      result.current.play();
    });
    expect(createAudioContext).toHaveBeenCalledTimes(1);
  });

  it('play() twice only creates one AudioContext', () => {
    const { result, createAudioContext } = renderNoiseHook();
    act(() => {
      result.current.play();
    });
    act(() => {
      result.current.play();
    });
    expect(createAudioContext).toHaveBeenCalledTimes(1);
  });

  it('stop() sets isPlaying to false', () => {
    const { result } = renderNoiseHook();
    act(() => {
      result.current.play();
    });
    act(() => {
      result.current.stop();
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it('can resume playback after stopping', () => {
    const { result } = renderNoiseHook();
    act(() => {
      result.current.play();
    });
    act(() => {
      result.current.stop();
    });
    act(() => {
      result.current.play();
    });
    expect(result.current.isPlaying).toBe(true);
  });

  it('setVolume() updates the volume state', () => {
    const { result } = renderNoiseHook();
    act(() => {
      result.current.setVolume(0.8);
    });
    expect(result.current.volume).toBe(0.8);
  });

  it('setVolume() applies to the engine even before playback', () => {
    const { result, ctx } = renderNoiseHook();
    act(() => {
      result.current.setVolume(0.3);
    });
    act(() => {
      result.current.play();
    });
    expect(ctx._gains[0].gain.value).toBe(0.3);
  });

  it('changing volume during playback updates the gain', () => {
    const { result, ctx } = renderNoiseHook();
    act(() => {
      result.current.play();
    });
    act(() => {
      result.current.setVolume(0.1);
    });
    expect(ctx._gains[0].gain.value).toBe(0.1);
  });

  it('toggle() flips between playing and stopped', () => {
    const { result } = renderNoiseHook();
    expect(result.current.isPlaying).toBe(false);
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isPlaying).toBe(true);
    act(() => {
      result.current.toggle();
    });
    expect(result.current.isPlaying).toBe(false);
  });

  it('unmount stops playback and closes the AudioContext', () => {
    const { result, ctx, unmount } = renderNoiseHook();
    act(() => {
      result.current.play();
    });

    unmount();

    expect(ctx.close).toHaveBeenCalledTimes(1);
  });

  it('default filterCutoff is the maximum (open)', () => {
    const { result } = renderNoiseHook();
    expect(result.current.filterCutoff).toBe(CUTOFF_MAX);
  });

  it('default playbackRate is 1', () => {
    const { result } = renderNoiseHook();
    expect(result.current.playbackRate).toBe(1);
  });

  it('setFilterCutoff updates the cutoff state', () => {
    const { result } = renderNoiseHook();
    act(() => {
      result.current.setFilterCutoff(800);
    });
    expect(result.current.filterCutoff).toBe(800);
  });

  it('setFilterCutoff applies to the engine even before playback', () => {
    const { result, ctx } = renderNoiseHook();
    act(() => {
      result.current.setFilterCutoff(500);
    });
    act(() => {
      result.current.play();
    });
    expect(ctx._filters[0].frequency.value).toBe(500);
  });

  it('setFilterCutoff updates the engine during playback', () => {
    const { result, ctx } = renderNoiseHook();
    act(() => {
      result.current.play();
    });
    act(() => {
      result.current.setFilterCutoff(300);
    });
    expect(ctx._filters[0].frequency.value).toBe(300);
  });

  it('setPlaybackRate updates the playbackRate state', () => {
    const { result } = renderNoiseHook();
    act(() => {
      result.current.setPlaybackRate(0.75);
    });
    expect(result.current.playbackRate).toBe(0.75);
  });

  it('setPlaybackRate applies to the source on play', () => {
    const { result, ctx } = renderNoiseHook();
    act(() => {
      result.current.setPlaybackRate(0.75);
    });
    act(() => {
      result.current.play();
    });
    expect(ctx._sources[0].playbackRate.value).toBe(0.75);
  });

  it('setPlaybackRate updates a live source during playback', () => {
    const { result, ctx } = renderNoiseHook();
    act(() => {
      result.current.play();
    });
    act(() => {
      result.current.setPlaybackRate(1.5);
    });
    expect(ctx._sources[0].playbackRate.value).toBe(1.5);
  });
});
