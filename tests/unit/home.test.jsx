import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { Home } from '../../src/pages/Home.jsx';

// Mock preact-router/match Link component
vi.mock('preact-router/match', () => ({
  Link: ({ children, href }) => <a href={href}>{children}</a>,
}));

describe('Home', () => {
  it('renders the page heading', () => {
    render(<Home />);
    expect(screen.getByText('Offline Tools')).toBeDefined();
  });

  it('renders the tagline', () => {
    render(<Home />);
    expect(screen.getByText('Browser-based utilities that work without an internet connection.')).toBeDefined();
  });

  it('renders a card for each tool', () => {
    render(<Home />);

    expect(screen.getByText('QR Code Generator')).toBeDefined();
    expect(screen.getByText('Data Explorer')).toBeDefined();
    expect(screen.getByText('Brown Noise Generator')).toBeDefined();
    expect(screen.getByText('Password Generator')).toBeDefined();
    expect(screen.getByText('Color Toolkit')).toBeDefined();
  });

  it('links each card to the correct route', () => {
    render(<Home />);

    expect(screen.getByText('QR Code Generator').closest('a').getAttribute('href')).toBe('/qr');
    expect(screen.getByText('Data Explorer').closest('a').getAttribute('href')).toBe('/data');
    expect(screen.getByText('Brown Noise Generator').closest('a').getAttribute('href')).toBe('/brown-noise');
    expect(screen.getByText('Password Generator').closest('a').getAttribute('href')).toBe('/password');
    expect(screen.getByText('Color Toolkit').closest('a').getAttribute('href')).toBe('/color');
  });
});
