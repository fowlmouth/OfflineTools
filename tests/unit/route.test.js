import { describe, it, expect, vi } from 'vitest';
import { route } from '../../src/utils/route.js';

describe('route', () => {
  it('returns the path unchanged when base is root', () => {
    expect(route('/')).toBe('/');
    expect(route('/qr')).toBe('/qr');
  });

  it('prefixes the path with the configured base url', () => {
    vi.stubEnv('BASE_URL', '/OfflineTools/');
    expect(route('/')).toBe('/OfflineTools/');
    expect(route('/qr')).toBe('/OfflineTools/qr');
    expect(route('/brown-noise')).toBe('/OfflineTools/brown-noise');
    vi.unstubAllEnvs();
  });

  it('does not produce double slashes', () => {
    vi.stubEnv('BASE_URL', '/OfflineTools/');
    expect(route('/json')).not.toContain('//');
    vi.unstubAllEnvs();
  });
});
