import { describe, it, expect } from 'vitest';
import { validateServiceName } from '@/lib/validation';

describe('validateServiceName', () => {
  it('returns null for valid names', () => {
    expect(validateServiceName('Wedding Photography')).toBeNull();
    expect(validateServiceName('DJ & Events')).toBeNull();
    expect(validateServiceName('Hair/Makeup')).toBeNull();
    expect(validateServiceName('abc')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(validateServiceName('')).not.toBeNull();
  });

  it('rejects spaces-only input', () => {
    expect(validateServiceName('   ')).not.toBeNull();
  });

  it('rejects names shorter than 3 chars', () => {
    expect(validateServiceName('ab')).not.toBeNull();
  });

  it('rejects names over 60 characters', () => {
    expect(validateServiceName('a'.repeat(61))).not.toBeNull();
  });

  it('rejects special characters / gibberish', () => {
    expect(validateServiceName('!!!###')).not.toBeNull();
    expect(validateServiceName('$$$')).not.toBeNull();
    expect(validateServiceName('@photography')).not.toBeNull();
  });

  it('accepts names at exactly 3 and 60 characters', () => {
    expect(validateServiceName('abc')).toBeNull();
    expect(validateServiceName('a'.repeat(60))).toBeNull();
  });
});
