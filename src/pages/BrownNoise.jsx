import { ToolPage } from '../components/layout/ToolPage.jsx';
import { useBrownNoise } from '../hooks/useBrownNoise.js';
import { useWakeLock } from '../hooks/useWakeLock.js';
import { sliderToCutoff, cutoffToSlider } from '../tools/brown-noise/mapping.js';
import './BrownNoise.css';

export function BrownNoise() {
  const { isPlaying, volume, filterCutoff, playbackRate, toggle, setVolume, setFilterCutoff, setPlaybackRate } = useBrownNoise();
  const wakeLock = useWakeLock();

  return (
    <ToolPage title="Brown Noise Generator" description="Continuous brown noise for focus and sleep. Runs entirely offline using the Web Audio API.">
      <div class="brown-noise">
        <div class="brown-noise-controls">
          <button type="button" class="brown-noise-toggle" onClick={toggle}>
            {isPlaying ? 'Stop' : 'Play'}
          </button>
        </div>

        <div class="brown-noise-sliders">
          <div class="brown-noise-slider">
            <label for="brown-noise-volume-input">Volume</label>
            <input
              id="brown-noise-volume-input"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onInput={(e) => setVolume(parseFloat(e.target.value))}
            />
            <span class="brown-noise-slider-value">{Math.round(volume * 100)}%</span>
          </div>

          <div class="brown-noise-slider">
            <label for="brown-noise-tone-input">Tone</label>
            <input
              id="brown-noise-tone-input"
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={cutoffToSlider(filterCutoff)}
              onInput={(e) => setFilterCutoff(sliderToCutoff(parseFloat(e.target.value)))}
            />
            <span class="brown-noise-slider-value">{Math.round(filterCutoff)} Hz</span>
          </div>

          <div class="brown-noise-slider">
            <label for="brown-noise-pitch-input">Pitch</label>
            <input
              id="brown-noise-pitch-input"
              type="range"
              min="0.5"
              max="2"
              step="0.01"
              value={playbackRate}
              onInput={(e) => setPlaybackRate(parseFloat(e.target.value))}
            />
            <span class="brown-noise-slider-value">{playbackRate.toFixed(2)}×</span>
          </div>
        </div>

        <label class="brown-noise-wakelock">
          <input
            type="checkbox"
            checked={wakeLock.active}
            disabled={!wakeLock.supported}
            onChange={(e) => (e.target.checked ? wakeLock.request() : wakeLock.release())}
          />
          Keep screen awake
        </label>
      </div>
    </ToolPage>
  );
}
