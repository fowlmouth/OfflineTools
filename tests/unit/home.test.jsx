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
    expect(screen.getByText('JSON Tool')).toBeDefined();
    expect(screen.getByText('YAML Tool')).toBeDefined();
    expect(screen.getByText('XML Tool')).toBeDefined();
    expect(screen.getByText('Brown Noise Generator')).toBeDefined();
  });

  it('links each card to the correct route', () => {
    render(<Home />);

    expect(screen.getByText('QR Code Generator').closest('a').getAttribute('href')).toBe('/qr');
    expect(screen.getByText('JSON Tool').closest('a').getAttribute('href')).toBe('/json');
    expect(screen.getByText('YAML Tool').closest('a').getAttribute('href')).toBe('/yaml');
    expect(screen.getByText('XML Tool').closest('a').getAttribute('href')).toBe('/xml');
    expect(screen.getByText('Brown Noise Generator').closest('a').getAttribute('href')).toBe('/brown-noise');
  });
});
