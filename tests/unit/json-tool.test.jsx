import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { JsonTool } from '../../src/pages/JsonTool.jsx';

// The json tool module is dynamically imported by useWasmTool.
// We mock the dynamic import to return a stub API.
vi.mock('../../src/tools/json/index.js', () => ({
  default: {
    validate: (input) => {
      try {
        JSON.parse(input);
        return { valid: true, error: null };
      } catch (e) {
        return { valid: false, error: e.message };
      }
    },
    format: (input) => JSON.stringify(JSON.parse(input), null, 2),
    minify: (input) => JSON.stringify(JSON.parse(input)),
  },
}));

describe('JsonTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title and description', async () => {
    render(<JsonTool />);

    expect(screen.getByText('JSON Tool')).toBeDefined();
    expect(screen.getByText('Validate, format, minify, and query JSON data.')).toBeDefined();
  });

  it('shows action buttons', async () => {
    render(<JsonTool />);

    await waitFor(() => {
      expect(screen.getByText('Validate & Format')).toBeDefined();
      expect(screen.getByText('Minify')).toBeDefined();
      expect(screen.getByText('Format')).toBeDefined();
    });
  });

  it('validates valid JSON and shows output', async () => {
    render(<JsonTool />);

    await waitFor(() => {
      expect(screen.getByText('Validate & Format')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '{"name":"test"}' } });
    fireEvent.click(screen.getByText('Validate & Format'));

    await waitFor(() => {
      expect(screen.getByText('Valid JSON')).toBeDefined();
    });
  });

  it('shows error for invalid JSON', async () => {
    render(<JsonTool />);

    await waitFor(() => {
      expect(screen.getByText('Validate & Format')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '{invalid}' } });
    fireEvent.click(screen.getByText('Validate & Format'));

    await waitFor(() => {
      expect(screen.getByText(/Invalid:/)).toBeDefined();
    });
  });
});
