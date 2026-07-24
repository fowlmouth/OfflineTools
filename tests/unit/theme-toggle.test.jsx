import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/preact';
import { ThemeToggle } from '../../src/components/layout/ThemeToggle.jsx';

describe('ThemeToggle', () => {
  it('renders a button', () => {
    const { getByRole } = render(<ThemeToggle theme="auto" setTheme={vi.fn()} />);
    expect(getByRole('button')).toBeTruthy();
  });

  it('displays "Auto" label when theme is auto', () => {
    const { getByRole } = render(<ThemeToggle theme="auto" setTheme={vi.fn()} />);
    expect(getByRole('button').textContent).toContain('Auto');
  });

  it('displays "Light" label when theme is light', () => {
    const { getByRole } = render(<ThemeToggle theme="light" setTheme={vi.fn()} />);
    expect(getByRole('button').textContent).toContain('Light');
  });

  it('displays "Dark" label when theme is dark', () => {
    const { getByRole } = render(<ThemeToggle theme="dark" setTheme={vi.fn()} />);
    expect(getByRole('button').textContent).toContain('Dark');
  });

  it('cycles auto → light on click', () => {
    const setTheme = vi.fn();
    const { getByRole } = render(<ThemeToggle theme="auto" setTheme={setTheme} />);
    fireEvent.click(getByRole('button'));
    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('cycles light → dark on click', () => {
    const setTheme = vi.fn();
    const { getByRole } = render(<ThemeToggle theme="light" setTheme={setTheme} />);
    fireEvent.click(getByRole('button'));
    expect(setTheme).toHaveBeenCalledWith('dark');
  });

  it('cycles dark → auto on click', () => {
    const setTheme = vi.fn();
    const { getByRole } = render(<ThemeToggle theme="dark" setTheme={setTheme} />);
    fireEvent.click(getByRole('button'));
    expect(setTheme).toHaveBeenCalledWith('auto');
  });
});
