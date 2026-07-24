import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { YamlTool } from '../../src/pages/YamlTool.jsx';

vi.mock('../../src/tools/yaml/index.js', () => ({
  default: {
    validate: (input) => {
      if (input.includes(': ')) {
        return { valid: true, error: null };
      }
      if (input.trim() === '') {
        return { valid: true, error: null };
      }
      return { valid: false, error: 'Invalid YAML' };
    },
    toJson: (input) => {
      if (input.includes(': ')) {
        const key = input.split(':')[0].trim();
        const value = input.split(':')[1].trim();
        return JSON.stringify({ [key]: value }, null, 2);
      }
      throw new Error('Cannot convert invalid YAML');
    },
  },
}));

describe('YamlTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title and description', async () => {
    render(<YamlTool />);

    expect(screen.getByText('YAML Tool')).toBeDefined();
    expect(screen.getByText('Validate and convert YAML data.')).toBeDefined();
  });

  it('shows action buttons', async () => {
    render(<YamlTool />);

    await waitFor(() => {
      expect(screen.getByText('Validate')).toBeDefined();
      expect(screen.getByText('Convert to JSON')).toBeDefined();
    });
  });

  it('validates valid YAML', async () => {
    render(<YamlTool />);

    await waitFor(() => {
      expect(screen.getByText('Validate')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: 'name: test' } });
    fireEvent.click(screen.getByText('Validate'));

    await waitFor(() => {
      expect(screen.getByText('Valid YAML')).toBeDefined();
    });
  });

  it('shows error for invalid YAML', async () => {
    render(<YamlTool />);

    await waitFor(() => {
      expect(screen.getByText('Validate')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '@@@invalid' } });
    fireEvent.click(screen.getByText('Validate'));

    await waitFor(() => {
      expect(screen.getByText(/Invalid:/)).toBeDefined();
    });
  });

  it('converts YAML to JSON', async () => {
    render(<YamlTool />);

    await waitFor(() => {
      expect(screen.getByText('Convert to JSON')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: 'name: test' } });
    fireEvent.click(screen.getByText('Convert to JSON'));

    await waitFor(() => {
      expect(screen.getByText('Valid YAML')).toBeDefined();
    });
  });
});
