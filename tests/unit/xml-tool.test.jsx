import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { XmlTool } from '../../src/pages/XmlTool.jsx';

vi.mock('../../src/tools/xml/index.js', () => ({
  default: {
    validate: (input) => {
      if (input.trim() === '') {
        return { valid: true, error: null };
      }
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(input, 'application/xml');
        const errorNode = doc.querySelector('parsererror');
        if (errorNode) {
          return { valid: false, error: errorNode.textContent };
        }
        return { valid: true, error: null };
      } catch (e) {
        return { valid: false, error: e.message };
      }
    },
    format: (input) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, 'application/xml');
      const errorNode = doc.querySelector('parsererror');
      if (errorNode) {
        throw new Error(errorNode.textContent);
      }
      return '<root>\n  <item>value</item>\n</root>';
    },
  },
}));

describe('XmlTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title and description', async () => {
    render(<XmlTool />);

    expect(screen.getByText('XML Tool')).toBeDefined();
    expect(screen.getByText('Validate and format XML documents.')).toBeDefined();
  });

  it('shows action buttons', async () => {
    render(<XmlTool />);

    await waitFor(() => {
      expect(screen.getByText('Validate')).toBeDefined();
      expect(screen.getByText('Format')).toBeDefined();
    });
  });

  it('validates valid XML', async () => {
    render(<XmlTool />);

    await waitFor(() => {
      expect(screen.getByText('Validate')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '<root><item>value</item></root>' } });
    fireEvent.click(screen.getByText('Validate'));

    await waitFor(() => {
      expect(screen.getByText('Valid XML')).toBeDefined();
    });
  });

  it('shows error for invalid XML', async () => {
    render(<XmlTool />);

    await waitFor(() => {
      expect(screen.getByText('Validate')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '<root><unclosed>' } });
    fireEvent.click(screen.getByText('Validate'));

    await waitFor(() => {
      expect(screen.getByText(/Invalid:/)).toBeDefined();
    });
  });

  it('formats valid XML', async () => {
    render(<XmlTool />);

    await waitFor(() => {
      expect(screen.getByText('Format')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '<root><item>value</item></root>' } });
    fireEvent.click(screen.getByText('Format'));

    await waitFor(() => {
      expect(screen.getByText('Valid XML')).toBeDefined();
    });
  });
});
