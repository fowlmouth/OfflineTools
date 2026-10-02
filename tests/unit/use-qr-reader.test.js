import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/preact';

const { decodeMock, fileToImageDataMock } = vi.hoisted(() => ({
  decodeMock: vi.fn(),
  fileToImageDataMock: vi.fn(),
}));

vi.mock('../../src/tools/qr/index.js', () => ({
  default: { decode: decodeMock, fileToImageData: fileToImageDataMock },
}));

import { useQrReader } from '../../src/hooks/useQrReader.js';

function imageFile(name = 'qr.png') {
  return new File([new Uint8Array(4)], name, { type: 'image/png' });
}

describe('useQrReader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has clean initial state', () => {
    const { result } = renderHook(() => useQrReader());
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.reading).toBe(false);
    expect(result.current.copied).toBe(false);
  });

  it('sets an error for a non-image file without decoding', async () => {
    const file = new File([new Uint8Array(4)], 'notes.txt', { type: 'text/plain' });
    const { result } = renderHook(() => useQrReader());

    await act(async () => {
      await result.current.read(file);
    });

    expect(result.current.error).toBe('Please select an image file.');
    expect(result.current.result).toBeNull();
    expect(decodeMock).not.toHaveBeenCalled();
  });

  it('sets an error when no file is given', async () => {
    const { result } = renderHook(() => useQrReader());

    await act(async () => {
      await result.current.read(null);
    });

    expect(result.current.error).toBe('Please select an image file.');
  });

  it('stores the decoded text on success', async () => {
    const imageData = { data: new Uint8ClampedArray(4), width: 1, height: 1 };
    fileToImageDataMock.mockResolvedValue(imageData);
    decodeMock.mockReturnValue('https://example.com');
    const { result } = renderHook(() => useQrReader());

    await act(async () => {
      await result.current.read(imageFile());
    });

    expect(fileToImageDataMock).toHaveBeenCalledTimes(1);
    expect(decodeMock).toHaveBeenCalledWith(imageData);
    expect(result.current.result).toBe('https://example.com');
    expect(result.current.error).toBeNull();
    expect(result.current.reading).toBe(false);
  });

  it('sets an error when the image contains no QR code', async () => {
    fileToImageDataMock.mockResolvedValue({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
    decodeMock.mockReturnValue(null);
    const { result } = renderHook(() => useQrReader());

    await act(async () => {
      await result.current.read(imageFile());
    });

    expect(result.current.error).toBe('No QR code found in image.');
    expect(result.current.result).toBeNull();
  });

  it('sets an error when the image cannot be read', async () => {
    fileToImageDataMock.mockRejectedValue(new Error('bad file'));
    const { result } = renderHook(() => useQrReader());

    await act(async () => {
      await result.current.read(imageFile());
    });

    expect(result.current.error).toBe('Could not read the image file.');
    expect(result.current.result).toBeNull();
    expect(result.current.reading).toBe(false);
  });

  it('clears a previous result before reading a new file', async () => {
    fileToImageDataMock.mockResolvedValue({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
    decodeMock.mockReturnValueOnce('first').mockReturnValueOnce('second');
    const { result } = renderHook(() => useQrReader());

    await act(async () => {
      await result.current.read(imageFile('a.png'));
    });
    expect(result.current.result).toBe('first');

    await act(async () => {
      await result.current.read(imageFile('b.png'));
    });
    expect(result.current.result).toBe('second');
    expect(result.current.error).toBeNull();
  });

  it('copies the result to the clipboard and reports copied state', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    fileToImageDataMock.mockResolvedValue({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
    decodeMock.mockReturnValue('https://example.com');
    const { result } = renderHook(() => useQrReader());

    await act(async () => {
      await result.current.read(imageFile());
    });
    await act(async () => {
      await result.current.copy();
    });

    expect(writeText).toHaveBeenCalledWith('https://example.com');
    expect(result.current.copied).toBe(true);
  });

  it('copy does nothing without a result', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const { result } = renderHook(() => useQrReader());

    await act(async () => {
      await result.current.copy();
    });

    expect(writeText).not.toHaveBeenCalled();
  });

  it('reset clears all state', async () => {
    fileToImageDataMock.mockResolvedValue({ data: new Uint8ClampedArray(4), width: 1, height: 1 });
    decodeMock.mockReturnValue('https://example.com');
    const { result } = renderHook(() => useQrReader());

    await act(async () => {
      await result.current.read(imageFile());
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.copied).toBe(false);
  });
});
