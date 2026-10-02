import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/preact';

const mockHook = vi.fn();

vi.mock('../../src/hooks/useQrReader.js', () => ({
  useQrReader: (...args) => mockHook(...args),
}));

vi.mock('../../src/tools/qr/index.js', () => ({
  default: {
    create: vi.fn(() => ({ append: vi.fn(), download: vi.fn() })),
  },
}));

import { QrCode } from '../../src/pages/QrCode.jsx';

function setupHook(overrides = {}) {
  const handlers = {
    read: vi.fn(),
    copy: vi.fn(),
    reset: vi.fn(),
  };
  mockHook.mockReturnValue({
    result: null,
    error: null,
    reading: false,
    copied: false,
    ...handlers,
    ...overrides,
  });
  return handlers;
}

function selectFile(input, file) {
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
}

describe('QrCode decode mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupHook();
  });

  it('renders a Decode Image mode button', () => {
    render(<QrCode />);
    expect(screen.getByRole('button', { name: 'Decode Image' })).toBeDefined();
  });

  it('shows the image file input when Decode Image mode is selected', () => {
    render(<QrCode />);
    fireEvent.click(screen.getByRole('button', { name: 'Decode Image' }));
    expect(screen.getByLabelText(/image file/i)).toBeDefined();
  });

  it('hides the generate actions in decode mode', () => {
    render(<QrCode />);
    fireEvent.click(screen.getByRole('button', { name: 'Decode Image' }));
    expect(screen.queryByRole('button', { name: 'Generate' })).toBeNull();
    expect(screen.queryByRole('button', { name: /download png/i })).toBeNull();
  });

  it('disables the Read button until a file is selected', () => {
    render(<QrCode />);
    fireEvent.click(screen.getByRole('button', { name: 'Decode Image' }));
    expect(screen.getByRole('button', { name: /read qr code/i }).disabled).toBe(true);
  });

  it('clicking Read QR Code calls read() with the selected file', () => {
    const handlers = setupHook();
    render(<QrCode />);
    fireEvent.click(screen.getByRole('button', { name: 'Decode Image' }));

    const file = new File([new Uint8Array(4)], 'qr.png', { type: 'image/png' });
    selectFile(screen.getByLabelText(/image file/i), file);
    fireEvent.click(screen.getByRole('button', { name: /read qr code/i }));

    expect(handlers.read).toHaveBeenCalledWith(file);
  });

  it('calls reset() when a new file is chosen', () => {
    const handlers = setupHook();
    render(<QrCode />);
    fireEvent.click(screen.getByRole('button', { name: 'Decode Image' }));

    const file = new File([new Uint8Array(4)], 'qr.png', { type: 'image/png' });
    selectFile(screen.getByLabelText(/image file/i), file);

    expect(handlers.reset).toHaveBeenCalledTimes(1);
  });

  it('shows the reading state on the Read button', () => {
    setupHook({ reading: true });
    render(<QrCode />);
    fireEvent.click(screen.getByRole('button', { name: 'Decode Image' }));

    expect(screen.getByRole('button', { name: /reading/i }).disabled).toBe(true);
  });

  it('shows the error message when decoding fails', () => {
    setupHook({ error: 'No QR code found in image.' });
    render(<QrCode />);
    fireEvent.click(screen.getByRole('button', { name: 'Decode Image' }));

    expect(screen.getByRole('alert').textContent).toBe('No QR code found in image.');
  });

  it('shows the decoded text when a QR code is read', () => {
    setupHook({ result: 'https://example.com' });
    render(<QrCode />);
    fireEvent.click(screen.getByRole('button', { name: 'Decode Image' }));

    expect(screen.getByLabelText(/decoded text/i).value).toBe('https://example.com');
  });

  it('shows a Copy button next to the result', () => {
    setupHook({ result: 'https://example.com' });
    render(<QrCode />);
    fireEvent.click(screen.getByRole('button', { name: 'Decode Image' }));

    expect(screen.getByRole('button', { name: /copy/i })).toBeDefined();
  });

  it('clicking Copy calls copy()', () => {
    const handlers = setupHook({ result: 'https://example.com' });
    render(<QrCode />);
    fireEvent.click(screen.getByRole('button', { name: 'Decode Image' }));

    fireEvent.click(screen.getByRole('button', { name: /copy/i }));
    expect(handlers.copy).toHaveBeenCalledTimes(1);
  });

  it('shows "Copied" after a successful copy', () => {
    setupHook({ result: 'https://example.com', copied: true });
    render(<QrCode />);
    fireEvent.click(screen.getByRole('button', { name: 'Decode Image' }));

    expect(screen.getByRole('button', { name: /copied/i })).toBeDefined();
  });

  it('switching back to a generate mode restores the Generate button', () => {
    render(<QrCode />);
    fireEvent.click(screen.getByRole('button', { name: 'Decode Image' }));
    fireEvent.click(screen.getByRole('button', { name: 'Plain Text' }));

    expect(screen.getByRole('button', { name: 'Generate' })).toBeDefined();
    expect(screen.queryByLabelText(/image file/i)).toBeNull();
  });
});
