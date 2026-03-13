import { describe, it, expect } from 'vitest';
import { validateServiceName, validateEmail, validatePassword } from '@/lib/validation';

describe('validateServiceName', () => {
  it('rejects empty string', () => {
    expect(validateServiceName('').valid).toBe(false);
  });

  it('rejects whitespace-only strings', () => {
    expect(validateServiceName('   ').valid).toBe(false);
  });

  it('rejects single character', () => {
    expect(validateServiceName('A').valid).toBe(false);
  });

  it('rejects special-characters-only input', () => {
    expect(validateServiceName('!!!').valid).toBe(false);
    expect(validateServiceName('???').valid).toBe(false);
  });

  it('accepts valid service names', () => {
    expect(validateServiceName('Wedding Photography').valid).toBe(true);
  });

  it('trims input before validating', () => {
    expect(validateServiceName('  DJ  ').valid).toBe(true);
  });

  it('rejects strings over 100 characters', () => {
    expect(validateServiceName('a'.repeat(101)).valid).toBe(false);
  });

  it('accepts names at exactly 2 characters', () => {
    expect(validateServiceName('DJ').valid).toBe(true);
  });

  it('accepts names at exactly 100 characters', () => {
    expect(validateServiceName('DJ' + 'a'.repeat(98)).valid).toBe(true);
  });
});

describe('validateEmail', () => {
  it('rejects empty string', () => {
    expect(validateEmail('').valid).toBe(false);
  });

  it('rejects invalid email format', () => {
    expect(validateEmail('notanemail').valid).toBe(false);
  });

  it('accepts valid email', () => {
    expect(validateEmail('user@example.com').valid).toBe(true);
  });
});

describe('validatePassword', () => {
  it('rejects passwords under 8 characters', () => {
    expect(validatePassword('short').valid).toBe(false);
    expect(validatePassword('1234567').valid).toBe(false);
  });

  it('accepts passwords of 8 or more characters', () => {
    expect(validatePassword('password123').valid).toBe(true);
    expect(validatePassword('12345678').valid).toBe(true);
  });
});
