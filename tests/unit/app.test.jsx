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
    expect(screen.getByText('JSON')).toBeDefined();
    expect(screen.getByText('YAML')).toBeDefined();
    expect(screen.getByText('XML')).toBeDefined();
    expect(screen.getByText('Brown Noise')).toBeDefined();
  });

  it('renders correct href for each tool', () => {
    render(<Header />);

    expect(screen.getByText('Home').getAttribute('href')).toBe('/');
    expect(screen.getByText('QR Code').getAttribute('href')).toBe('/qr');
    expect(screen.getByText('JSON').getAttribute('href')).toBe('/json');
    expect(screen.getByText('YAML').getAttribute('href')).toBe('/yaml');
    expect(screen.getByText('XML').getAttribute('href')).toBe('/xml');
    expect(screen.getByText('Brown Noise').getAttribute('href')).toBe('/brown-noise');
  });
});
