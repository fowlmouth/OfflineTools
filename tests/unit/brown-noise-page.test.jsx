import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { BrownNoise } from '../../src/pages/BrownNoise.jsx';
import {
  CUTOFF_MAX,
  CUTOFF_MIN,
  sliderToCutoff,
  cutoffToSlider,
} from '../../src/tools/brown-noise/mapping.js';

const mockHook = vi.fn();
const mockWakeLock = vi.fn();

vi.mock('../../src/hooks/useBrownNoise.js', () => ({
  useBrownNoise: (...args) => mockHook(...args),
}));

vi.mock('../../src/hooks/useWakeLock.js', () => ({
  useWakeLock: (...args) => mockWakeLock(...args),
}));

function setupHook(overrides = {}) {
  const handlers = {
    toggle: vi.fn(),
    setVolume: vi.fn(),
    setFilterCutoff: vi.fn(),
    setPlaybackRate: vi.fn(),
  };
  mockHook.mockReturnValue({
    isPlaying: false,
    volume: 0.5,
    filterCutoff: CUTOFF_MAX,
    playbackRate: 1,
    ...handlers,
    ...overrides,
  });
  return handlers;
}

function setupWakeLock(overrides = {}) {
  const fns = { request: vi.fn(), release: vi.fn() };
  mockWakeLock.mockReturnValue({
    supported: true,
    active: false,
    ...fns,
    ...overrides,
  });
  return fns;
}

describe('BrownNoise', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHook();
    setupWakeLock();
  });

  it('renders the page title', () => {
    render(<BrownNoise />);
    expect(screen.getByText('Brown Noise Generator')).toBeDefined();
  });

  it('renders a description', () => {
    render(<BrownNoise />);
    expect(
      screen.getByText(/continuous brown noise/i),
    ).toBeDefined();
  });

  it('renders a Play button when not playing', () => {
    render(<BrownNoise />);
    expect(screen.getByRole('button', { name: 'Play' })).toBeDefined();
  });

  it('renders a Stop button when playing', () => {
    setupHook({ isPlaying: true });
    render(<BrownNoise />);
    expect(screen.getByRole('button', { name: 'Stop' })).toBeDefined();
  });

  it('clicking the toggle button calls toggle()', () => {
    const handlers = setupHook();
    render(<BrownNoise />);
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(handlers.toggle).toHaveBeenCalledTimes(1);
  });

  it('renders a volume slider', () => {
    render(<BrownNoise />);
    expect(screen.getByLabelText('Volume')).toBeDefined();
  });

  it('the slider reflects the current volume', () => {
    setupHook({ volume: 0.7 });
    render(<BrownNoise />);
    expect(screen.getByLabelText('Volume').value).toBe('0.7');
  });

  it('changing the slider calls setVolume()', () => {
    const handlers = setupHook();
    render(<BrownNoise />);
    const slider = screen.getByLabelText('Volume');
    fireEvent.input(slider, { target: { value: '0.9' } });
    expect(handlers.setVolume).toHaveBeenCalledWith(0.9);
  });

  it('renders a Tone slider', () => {
    render(<BrownNoise />);
    expect(screen.getByLabelText('Tone')).toBeDefined();
  });

  it('the Tone slider is fully open by default (rightmost position)', () => {
    render(<BrownNoise />);
    expect(screen.getByLabelText('Tone').value).toBe('1');
  });

  it('the Tone slider position reflects the current cutoff', () => {
    setupHook({ filterCutoff: 1000 });
    render(<BrownNoise />);
    expect(screen.getByLabelText('Tone').value).toBeCloseTo(cutoffToSlider(1000), 5);
  });

  it('changing the Tone slider maps to a cutoff frequency in Hz', () => {
    const handlers = setupHook();
    render(<BrownNoise />);
    const slider = screen.getByLabelText('Tone');

    fireEvent.input(slider, { target: { value: '0' } });
    expect(handlers.setFilterCutoff).toHaveBeenCalledWith(CUTOFF_MIN);

    fireEvent.input(slider, { target: { value: '1' } });
    expect(handlers.setFilterCutoff).toHaveBeenCalledWith(CUTOFF_MAX);
  });

  it('displays the current Tone cutoff in Hz', () => {
    setupHook({ filterCutoff: 1200 });
    render(<BrownNoise />);
    expect(screen.getByText('1200 Hz')).toBeDefined();
  });

  it('renders a Pitch slider', () => {
    render(<BrownNoise />);
    expect(screen.getByLabelText('Pitch')).toBeDefined();
  });

  it('the Pitch slider reflects the current playback rate', () => {
    setupHook({ playbackRate: 1.5 });
    render(<BrownNoise />);
    expect(screen.getByLabelText('Pitch').value).toBe('1.5');
  });

  it('changing the Pitch slider calls setPlaybackRate()', () => {
    const handlers = setupHook();
    render(<BrownNoise />);
    const slider = screen.getByLabelText('Pitch');
    fireEvent.input(slider, { target: { value: '0.75' } });
    expect(handlers.setPlaybackRate).toHaveBeenCalledWith(0.75);
  });

  it('displays the current pitch as a multiplier', () => {
    setupHook({ playbackRate: 0.75 });
    render(<BrownNoise />);
    expect(screen.getByText('0.75×')).toBeDefined();
  });

  it('renders a keep-awake checkbox', () => {
    render(<BrownNoise />);
    expect(screen.getByRole('checkbox', { name: /keep screen awake/i })).toBeDefined();
  });

  it('the keep-awake checkbox is unchecked when inactive', () => {
    setupWakeLock({ active: false });
    render(<BrownNoise />);
    expect(screen.getByRole('checkbox', { name: /keep screen awake/i }).checked).toBe(false);
  });

  it('the keep-awake checkbox is checked when active', () => {
    setupWakeLock({ active: true });
    render(<BrownNoise />);
    expect(screen.getByRole('checkbox', { name: /keep screen awake/i }).checked).toBe(true);
  });

  it('checking the keep-awake checkbox requests a wake lock', () => {
    const wakeLock = setupWakeLock();
    render(<BrownNoise />);
    fireEvent.click(screen.getByRole('checkbox', { name: /keep screen awake/i }));
    expect(wakeLock.request).toHaveBeenCalledTimes(1);
  });

  it('unchecking the keep-awake checkbox releases the wake lock', () => {
    const wakeLock = setupWakeLock({ active: true });
    render(<BrownNoise />);
    fireEvent.click(screen.getByRole('checkbox', { name: /keep screen awake/i }));
    expect(wakeLock.release).toHaveBeenCalledTimes(1);
  });

  it('disables the keep-awake checkbox when wake lock is unsupported', () => {
    setupWakeLock({ supported: false });
    render(<BrownNoise />);
    expect(screen.getByRole('checkbox', { name: /keep screen awake/i }).disabled).toBe(true);
  });
});
