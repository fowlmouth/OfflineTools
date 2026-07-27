import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';
import { PasswordGenerator } from '../../src/pages/PasswordGenerator.jsx';

const mockHook = vi.fn();

vi.mock('../../src/hooks/usePasswordGenerator.js', () => ({
  usePasswordGenerator: (...args) => mockHook(...args),
}));

function setupHook(overrides = {}) {
  const handlers = {
    generate: vi.fn(),
    setLength: vi.fn(),
    setOption: vi.fn(),
    setExcludeAmbiguous: vi.fn(),
    generateBatch: vi.fn(),
    copy: vi.fn(),
  };
  mockHook.mockReturnValue({
    length: 16,
    lowercase: true,
    uppercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
    password: 'Abc123!@#xyz789',
    batch: [],
    copied: false,
    strength: { bits: 100, score: 4, label: 'Very Strong' },
    ...handlers,
    ...overrides,
  });
  return handlers;
}

describe('PasswordGenerator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHook();
  });

  it('renders the page title', () => {
    render(<PasswordGenerator />);
    expect(screen.getByText('Password Generator')).toBeDefined();
  });

  it('renders a description', () => {
    render(<PasswordGenerator />);
    expect(screen.getByText(/offline, in your browser/i)).toBeDefined();
  });

  it('displays the generated password', () => {
    render(<PasswordGenerator />);
    expect(screen.getByDisplayValue('Abc123!@#xyz789')).toBeDefined();
  });

  it('renders a Copy button', () => {
    render(<PasswordGenerator />);
    expect(screen.getByRole('button', { name: /copy/i })).toBeDefined();
  });

  it('shows "Copied" after a successful copy', () => {
    setupHook({ copied: true });
    render(<PasswordGenerator />);
    expect(screen.getByRole('button', { name: /copied/i })).toBeDefined();
  });

  it('clicking Copy calls copy()', () => {
    const handlers = setupHook();
    render(<PasswordGenerator />);
    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(handlers.copy).toHaveBeenCalledTimes(1);
  });

  it('renders a Generate button', () => {
    render(<PasswordGenerator />);
    expect(screen.getByRole('button', { name: 'Generate' })).toBeDefined();
  });

  it('clicking Generate calls generate()', () => {
    const handlers = setupHook();
    render(<PasswordGenerator />);
    handlers.generate.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
    expect(handlers.generate).toHaveBeenCalledTimes(1);
  });

  it('renders a length slider', () => {
    render(<PasswordGenerator />);
    expect(screen.getByLabelText('Length')).toBeDefined();
  });

  it('the length slider reflects the current length', () => {
    setupHook({ length: 24 });
    render(<PasswordGenerator />);
    expect(screen.getByLabelText('Length').value).toBe('24');
  });

  it('changing the length slider calls setLength()', () => {
    const handlers = setupHook();
    render(<PasswordGenerator />);
    fireEvent.input(screen.getByLabelText('Length'), { target: { value: '32' } });
    expect(handlers.setLength).toHaveBeenCalledWith(32);
  });

  it('renders a checkbox for each character set', () => {
    render(<PasswordGenerator />);
    expect(screen.getByLabelText(/lowercase/i)).toBeDefined();
    expect(screen.getByLabelText(/uppercase/i)).toBeDefined();
    expect(screen.getByLabelText(/numbers/i)).toBeDefined();
    expect(screen.getByLabelText(/symbols/i)).toBeDefined();
  });

  it('a checkbox reflects its current state', () => {
    setupHook({ symbols: false });
    render(<PasswordGenerator />);
    expect(screen.getByLabelText(/symbols/i).checked).toBe(false);
  });

  it('toggling a checkbox calls setOption()', () => {
    const handlers = setupHook();
    render(<PasswordGenerator />);
    fireEvent.click(screen.getByLabelText(/numbers/i));
    expect(handlers.setOption).toHaveBeenCalledWith('numbers', false);
  });

  it('renders an exclude-ambiguous checkbox', () => {
    render(<PasswordGenerator />);
    expect(screen.getByLabelText(/exclude ambiguous/i)).toBeDefined();
  });

  it('toggling exclude-ambiguous calls setExcludeAmbiguous()', () => {
    const handlers = setupHook();
    render(<PasswordGenerator />);
    fireEvent.click(screen.getByLabelText(/exclude ambiguous/i));
    expect(handlers.setExcludeAmbiguous).toHaveBeenCalledWith(true);
  });

  it('renders the strength label', () => {
    render(<PasswordGenerator />);
    expect(screen.getByText('Very Strong')).toBeDefined();
  });

  it('renders the strength bits', () => {
    render(<PasswordGenerator />);
    expect(screen.getByText(/100\s*bits/)).toBeDefined();
  });

  it('renders a bulk count input', () => {
    render(<PasswordGenerator />);
    expect(screen.getByLabelText(/how many/i)).toBeDefined();
  });

  it('clicking Generate Batch calls generateBatch()', () => {
    const handlers = setupHook();
    render(<PasswordGenerator />);
    fireEvent.change(screen.getByLabelText(/how many/i), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /generate batch/i }));
    expect(handlers.generateBatch).toHaveBeenCalledWith(5);
  });

  it('lists the batch passwords when available', () => {
    setupHook({ batch: ['pw1', 'pw2', 'pw3'] });
    render(<PasswordGenerator />);
    expect(screen.getByText('pw1')).toBeDefined();
    expect(screen.getByText('pw2')).toBeDefined();
    expect(screen.getByText('pw3')).toBeDefined();
  });
});
