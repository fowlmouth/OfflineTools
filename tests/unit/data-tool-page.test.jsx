import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { DataTool } from '../../src/pages/DataTool.jsx';

vi.mock('../../src/tools/data/index.js', () => ({
  default: {
    detect: (input) => {
      if (input.trim().startsWith('{') || input.trim().startsWith('[')) return 'json';
      if (input.trim().startsWith('<')) return 'xml';
      if (input.trim() === '') return 'unknown';
      return 'yaml';
    },
    validate: (input) => {
      const fmt = input.trim().startsWith('{') ? 'json' : 'unknown';
      if (input.trim() === '') return { format: 'unknown', valid: false, error: 'Could not detect format' };
      if (input.includes('bad')) return { format: fmt, valid: false, error: 'Parse error' };
      return { format: fmt, valid: true, error: null };
    },
    format: (input) => {
      return JSON.stringify(JSON.parse(input), null, 2);
    },
    toJSON: (input) => {
      return JSON.stringify(JSON.parse(input), null, 2);
    },
    queryData: (input, expr) => {
      const data = JSON.parse(input);
      if (expr === '.name') return JSON.stringify(data.name);
      if (expr === '.') return JSON.stringify(data, null, 2);
      return 'null';
    },
  },
}));

describe('DataTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title and description', async () => {
    render(<DataTool />);

    expect(screen.getByText('Data Explorer')).toBeDefined();
    expect(screen.getByText(/Validate, convert, and query/)).toBeDefined();
  });

  it('shows a resizable input textarea', async () => {
    render(<DataTool />);

    await waitFor(() => {
      const textarea = screen.getByLabelText('Input');
      expect(textarea).toBeDefined();
    });
  });

  it('shows a query input field', async () => {
    render(<DataTool />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('.field')).toBeDefined();
    });
  });

  it('shows action buttons', async () => {
    render(<DataTool />);

    await waitFor(() => {
      expect(screen.getByText('Format')).toBeDefined();
      expect(screen.getByText('Convert to JSON')).toBeDefined();
    });
  });

  it('auto-detects format as user types JSON', async () => {
    render(<DataTool />);

    await waitFor(() => {
      expect(screen.getByLabelText('Input')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '{"name":"test"}' } });

    await waitFor(() => {
      expect(screen.getByText('JSON')).toBeDefined();
    });
  });

  it('auto-detects format as user types YAML', async () => {
    render(<DataTool />);

    await waitFor(() => {
      expect(screen.getByLabelText('Input')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: 'name: test' } });

    await waitFor(() => {
      expect(screen.getByText('YAML')).toBeDefined();
    });
  });

  it('auto-detects format as user types XML', async () => {
    render(<DataTool />);

    await waitFor(() => {
      expect(screen.getByLabelText('Input')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '<root/>' } });

    await waitFor(() => {
      expect(screen.getByText('XML')).toBeDefined();
    });
  });

  it('runs a query and shows results', async () => {
    render(<DataTool />);

    await waitFor(() => {
      expect(screen.getByLabelText('Input')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '{"name":"Alice"}' } });

    const queryInput = screen.getByPlaceholderText('.field');
    fireEvent.input(queryInput, { target: { value: '.name' } });

    fireEvent.click(screen.getByText('Run Query'));

    await waitFor(() => {
      const output = screen.getByLabelText('Output');
      expect(output.value).toContain('Alice');
    });
  });

  it('formats input and shows output', async () => {
    render(<DataTool />);

    await waitFor(() => {
      expect(screen.getByLabelText('Input')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '{"name":"test"}' } });

    fireEvent.click(screen.getByText('Format'));

    await waitFor(() => {
      const output = screen.getByLabelText('Output');
      expect(output.value).toContain('"name"');
    });
  });

  it('converts to JSON and shows output', async () => {
    render(<DataTool />);

    await waitFor(() => {
      expect(screen.getByLabelText('Input')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '{"name":"test"}' } });

    fireEvent.click(screen.getByText('Convert to JSON'));

    await waitFor(() => {
      const output = screen.getByLabelText('Output');
      expect(output.value).toContain('"name"');
    });
  });

  it('shows validation badge for invalid input', async () => {
    render(<DataTool />);

    await waitFor(() => {
      expect(screen.getByLabelText('Input')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '{"bad": }' } });
    fireEvent.click(screen.getByText('Format'));

    await waitFor(() => {
      expect(screen.getByText(/Invalid:/)).toBeDefined();
    });
  });

  it('shows a format badge that updates when input is cleared', async () => {
    render(<DataTool />);

    await waitFor(() => {
      expect(screen.getByLabelText('Input')).toBeDefined();
    });

    const textarea = screen.getByLabelText('Input');
    fireEvent.input(textarea, { target: { value: '{"name":"test"}' } });

    await waitFor(() => {
      expect(screen.getByText('JSON')).toBeDefined();
    });

    fireEvent.input(textarea, { target: { value: '' } });

    await waitFor(() => {
      expect(screen.getByText('—')).toBeDefined();
    });
  });
});
