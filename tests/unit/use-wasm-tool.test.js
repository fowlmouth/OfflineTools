import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/preact';
import { useWasmTool } from '../../src/hooks/useWasmTool.js';

describe('useWasmTool', () => {
  it('starts in not-ready state', () => {
    const loader = () => Promise.resolve({ default: { validate: vi.fn() } });
    const { result } = renderHook(() => useWasmTool(loader));

    expect(result.current.ready).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.api).toBeNull();
  });

  it('loads the module and sets ready=true', async () => {
    const mockApi = { validate: vi.fn() };
    const loader = () => Promise.resolve({ default: mockApi });
    const { result } = renderHook(() => useWasmTool(loader));

    await waitFor(() => {
      expect(result.current.ready).toBe(true);
    });

    expect(result.current.api).toBe(mockApi);
    expect(result.current.error).toBeNull();
  });

  it('captures load errors', async () => {
    const loader = () => Promise.reject(new Error('load failed'));
    const { result } = renderHook(() => useWasmTool(loader));

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    expect(result.current.ready).toBe(false);
    expect(result.current.error.message).toBe('load failed');
  });
});
