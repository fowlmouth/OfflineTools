import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { Header } from '../../src/components/layout/Header.jsx';

// Mock preact-router/match Link component
vi.mock('preact-router/match', () => ({
  Link: ({ children, href }) => <a href={href}>{children}</a>,
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navigation links for all tools', () => {
    render(<Header />);

    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('QR Code')).toBeDefined();
    expect(screen.getByText('Data Explorer')).toBeDefined();
    expect(screen.getByText('Brown Noise')).toBeDefined();
    expect(screen.getByText('Passwords')).toBeDefined();
    expect(screen.getByText('Color')).toBeDefined();
  });

  it('renders correct href for each tool', () => {
    render(<Header />);

    expect(screen.getByText('Home').getAttribute('href')).toBe('/');
    expect(screen.getByText('QR Code').getAttribute('href')).toBe('/qr');
    expect(screen.getByText('Data Explorer').getAttribute('href')).toBe('/data');
    expect(screen.getByText('Brown Noise').getAttribute('href')).toBe('/brown-noise');
    expect(screen.getByText('Passwords').getAttribute('href')).toBe('/password');
    expect(screen.getByText('Color').getAttribute('href')).toBe('/color');
  });
});
