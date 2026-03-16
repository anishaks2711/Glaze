import { describe, it, expect } from 'vitest';
import { validateServiceName, validateEmail, validatePassword, validateTagline, validateCaption, validatePortfolioFile } from '@/lib/validation';

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

describe('validateTagline', () => {
  it('accepts empty string (tagline is optional)', () => {
    expect(validateTagline('').valid).toBe(true);
  });

  it('accepts valid tagline', () => {
    expect(validateTagline('5-star baker in NYC').valid).toBe(true);
  });

  it('rejects tagline over 150 characters', () => {
    expect(validateTagline('a'.repeat(151)).valid).toBe(false);
  });

  it('accepts exactly 150 characters', () => {
    expect(validateTagline('a'.repeat(150)).valid).toBe(true);
  });
});

describe('validateCaption', () => {
  it('accepts empty string (caption is optional)', () => {
    expect(validateCaption('').valid).toBe(true);
  });

  it('accepts valid caption', () => {
    expect(validateCaption('My portfolio photo').valid).toBe(true);
  });

  it('rejects caption over 200 characters', () => {
    expect(validateCaption('a'.repeat(201)).valid).toBe(false);
  });

  it('accepts exactly 200 characters', () => {
    expect(validateCaption('a'.repeat(200)).valid).toBe(true);
  });
});

describe('validatePortfolioFile', () => {
  it('rejects non-image files', () => {
    const file = new File([''], 'video.mp4', { type: 'video/mp4' });
    expect(validatePortfolioFile(file).valid).toBe(false);
  });

  it('accepts image files', () => {
    const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
    expect(validatePortfolioFile(file).valid).toBe(true);
  });

  it('accepts png and webp image types', () => {
    expect(validatePortfolioFile(new File([''], 'a.png', { type: 'image/png' })).valid).toBe(true);
    expect(validatePortfolioFile(new File([''], 'a.webp', { type: 'image/webp' })).valid).toBe(true);
  });

  it('rejects files over 10MB', () => {
    const bigData = new Uint8Array(11 * 1024 * 1024);
    const file = new File([bigData], 'big.jpg', { type: 'image/jpeg' });
    expect(validatePortfolioFile(file).valid).toBe(false);
  });

  it('accepts files at exactly 10MB', () => {
    const data = new Uint8Array(10 * 1024 * 1024);
    const file = new File([data], 'ok.jpg', { type: 'image/jpeg' });
    expect(validatePortfolioFile(file).valid).toBe(true);
  });
});
