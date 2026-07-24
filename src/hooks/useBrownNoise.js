import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { createBrownNoiseEngine } from '../tools/brown-noise/audio-engine.js';
import { CUTOFF_MAX } from '../tools/brown-noise/mapping.js';

const DEFAULT_VOLUME = 0.5;
const DEFAULT_PLAYBACK_RATE = 1;

export function useBrownNoise(options = {}) {
  const createAudioContext = options.createAudioContext ?? defaultCreateAudioContext;
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(options.volume ?? DEFAULT_VOLUME);
  const [filterCutoff, setFilterCutoffState] = useState(options.filterCutoff ?? CUTOFF_MAX);
  const [playbackRate, setPlaybackRateState] = useState(options.playbackRate ?? DEFAULT_PLAYBACK_RATE);

  const ctxRef = useRef(null);
  const engineRef = useRef(null);
  const volumeRef = useRef(volume);
  const cutoffRef = useRef(filterCutoff);
  const rateRef = useRef(playbackRate);

  function ensureEngine() {
    if (!ctxRef.current) {
      ctxRef.current = createAudioContext();
    }
    if (!engineRef.current) {
      engineRef.current = createBrownNoiseEngine(ctxRef.current, {
        volume: volumeRef.current,
        filterCutoff: cutoffRef.current,
        playbackRate: rateRef.current,
      });
    }
    return engineRef.current;
  }

  const play = useCallback(() => {
    ensureEngine().play();
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (engineRef.current?.isPlaying()) {
      stop();
    } else {
      play();
    }
  }, [play, stop]);

  const setVolume = useCallback((value) => {
    volumeRef.current = value;
    engineRef.current?.setVolume(value);
    setVolumeState(value);
  }, []);

  const setFilterCutoff = useCallback((value) => {
    cutoffRef.current = value;
    engineRef.current?.setFilterCutoff(value);
    setFilterCutoffState(value);
  }, []);

  const setPlaybackRate = useCallback((value) => {
    rateRef.current = value;
    engineRef.current?.setPlaybackRate(value);
    setPlaybackRateState(value);
  }, []);

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      ctxRef.current?.close?.();
      ctxRef.current = null;
      engineRef.current = null;
    };
  }, []);

  return {
    isPlaying,
    volume,
    filterCutoff,
    playbackRate,
    play,
    stop,
    toggle,
    setVolume,
    setFilterCutoff,
    setPlaybackRate,
  };
}

function defaultCreateAudioContext() {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  return new Ctor();
}
