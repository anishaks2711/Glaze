import { describe, it, expect } from 'vitest';
import { getPostSignupRedirect } from '@/lib/routing';

describe('getPostSignupRedirect', () => {
  it('returns /onboard for freelancer role', () => {
    expect(getPostSignupRedirect('freelancer')).toBe('/onboard');
  });

  it('returns / for client role', () => {
    expect(getPostSignupRedirect('client')).toBe('/');
  });

  it('returns a string path (usable with navigate + replace: true)', () => {
    expect(typeof getPostSignupRedirect('freelancer')).toBe('string');
    expect(typeof getPostSignupRedirect('client')).toBe('string');
  });
});
