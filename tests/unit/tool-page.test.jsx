import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { ToolPage } from '../../src/components/layout/ToolPage.jsx';

describe('ToolPage', () => {
  it('renders title and description', () => {
    render(
      <ToolPage title="Test Tool" description="A test tool">
        <p>Content</p>
      </ToolPage>
    );

    expect(screen.getByText('Test Tool')).toBeDefined();
    expect(screen.getByText('A test tool')).toBeDefined();
    expect(screen.getByText('Content')).toBeDefined();
  });

  it('renders without description when not provided', () => {
    render(
      <ToolPage title="No Desc">
        <p>Content</p>
      </ToolPage>
    );

    expect(screen.getByText('No Desc')).toBeDefined();
    expect(screen.getByText('Content')).toBeDefined();
  });

  it('renders loading state', () => {
    render(
      <ToolPage title="Loading Tool" loading={true}>
        <p>Should not render</p>
      </ToolPage>
    );

    expect(screen.getByText('Loading tool…')).toBeDefined();
    expect(screen.queryByText('Should not render')).toBeNull();
  });

  it('renders error state', () => {
    const error = new Error('WASM init failed');

    render(
      <ToolPage title="Error Tool" error={error}>
        <p>Should not render</p>
      </ToolPage>
    );

    expect(screen.getByText(/WASM init failed/)).toBeDefined();
    expect(screen.queryByText('Should not render')).toBeNull();
  });
});
