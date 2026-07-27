import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { ColorToolkit } from '../../src/pages/ColorToolkit.jsx';

const mockHook = vi.fn();

vi.mock('../../src/hooks/useColorToolkit.js', () => ({
  useColorToolkit: (...args) => mockHook(...args),
}));

function setupHook(overrides = {}) {
  const handlers = {
    setBase: vi.fn(),
    setScheme: vi.fn(),
    setForeground: vi.fn(),
    setBackground: vi.fn(),
    copy: vi.fn(),
  };
  mockHook.mockReturnValue({
    base: '#3b82f6',
    rgb: { r: 59, g: 130, b: 246 },
    hsl: { h: 217, s: 91, l: 60 },
    valid: true,
    scheme: 'triadic',
    palette: ['#ff8800', '#00ff88', '#8800ff'],
    foreground: '#000000',
    background: '#ffffff',
    contrast: 21,
    wcag: { aa: true, aaLarge: true, aaa: true, aaaLarge: true },
    copiedValue: null,
    ...handlers,
    ...overrides,
  });
  return handlers;
}

describe('ColorToolkit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHook();
  });

  it('renders the page title', () => {
    render(<ColorToolkit />);
    expect(screen.getByText('Color Toolkit')).toBeDefined();
  });

  it('renders a description', () => {
    render(<ColorToolkit />);
    expect(screen.getByText(/convert between/i)).toBeDefined();
  });

  it('renders a native color picker bound to the base color', () => {
    render(<ColorToolkit />);
    const picker = screen.getByLabelText(/base color/i);
    expect(picker.type).toBe('color');
    expect(picker.value).toBe('#3b82f6');
  });

  it('changing the color picker calls setBase()', () => {
    const handlers = setupHook();
    render(<ColorToolkit />);
    fireEvent.input(screen.getByLabelText(/base color/i), { target: { value: '#ff0000' } });
    expect(handlers.setBase).toHaveBeenCalledWith('#ff0000');
  });

  it('renders a hex text input', () => {
    render(<ColorToolkit />);
    expect(screen.getByLabelText('HEX')).toBeDefined();
  });

  it('the hex input reflects the base color', () => {
    render(<ColorToolkit />);
    expect(screen.getByLabelText('HEX').value).toBe('#3b82f6');
  });

  it('typing in the hex input calls setBase()', () => {
    const handlers = setupHook();
    render(<ColorToolkit />);
    fireEvent.input(screen.getByLabelText('HEX'), { target: { value: '#00ff00' } });
    expect(handlers.setBase).toHaveBeenCalledWith('#00ff00');
  });

  it('displays the RGB conversion', () => {
    render(<ColorToolkit />);
    expect(screen.getByText('59, 130, 246')).toBeDefined();
  });

  it('displays the HSL conversion', () => {
    render(<ColorToolkit />);
    expect(screen.getByText('217°, 91%, 60%')).toBeDefined();
  });

  it('renders a foreground picker for the contrast checker', () => {
    render(<ColorToolkit />);
    expect(screen.getByLabelText(/foreground/i)).toBeDefined();
  });

  it('changing the foreground picker calls setForeground()', () => {
    const handlers = setupHook();
    render(<ColorToolkit />);
    fireEvent.input(screen.getByLabelText(/foreground/i), { target: { value: '#777777' } });
    expect(handlers.setForeground).toHaveBeenCalledWith('#777777');
  });

  it('renders a background picker for the contrast checker', () => {
    render(<ColorToolkit />);
    expect(screen.getByLabelText(/background/i)).toBeDefined();
  });

  it('changing the background picker calls setBackground()', () => {
    const handlers = setupHook();
    render(<ColorToolkit />);
    fireEvent.input(screen.getByLabelText(/background/i), { target: { value: '#123456' } });
    expect(handlers.setBackground).toHaveBeenCalledWith('#123456');
  });

  it('displays the contrast ratio', () => {
    render(<ColorToolkit />);
    expect(screen.getByText('21.00:1')).toBeDefined();
  });

  it('renders WCAG level badges', () => {
    render(<ColorToolkit />);
    expect(screen.getByText('AA')).toBeDefined();
    expect(screen.getByText('AAA')).toBeDefined();
  });

  it('renders a scheme selector', () => {
    render(<ColorToolkit />);
    expect(screen.getByLabelText(/scheme/i)).toBeDefined();
  });

  it('the scheme selector reflects the current scheme', () => {
    setupHook({ scheme: 'monochromatic' });
    render(<ColorToolkit />);
    expect(screen.getByLabelText(/scheme/i).value).toBe('monochromatic');
  });

  it('changing the scheme selector calls setScheme()', () => {
    const handlers = setupHook();
    render(<ColorToolkit />);
    fireEvent.change(screen.getByLabelText(/scheme/i), { target: { value: 'analogous' } });
    expect(handlers.setScheme).toHaveBeenCalledWith('analogous');
  });

  it('renders a swatch for each palette color', () => {
    render(<ColorToolkit />);
    expect(screen.getByText('#ff8800')).toBeDefined();
    expect(screen.getByText('#00ff88')).toBeDefined();
    expect(screen.getByText('#8800ff')).toBeDefined();
  });

  it('clicking a palette swatch calls copy()', () => {
    const handlers = setupHook();
    render(<ColorToolkit />);
    fireEvent.click(screen.getByText('#ff8800'));
    expect(handlers.copy).toHaveBeenCalledWith('#ff8800');
  });
});
