import { describe, it, expect } from 'vitest';
import { validateFullName, validateServiceName, validateEmail, validatePassword, validateTagline, validateCaption, validatePortfolioFile, validateCategory, validateReviewPrompt, validateSocialUsername } from '@/lib/validation';

describe('validateFullName', () => {
  it('rejects empty string', () => {
    expect(validateFullName('').valid).toBe(false);
  });

  it('rejects whitespace-only strings', () => {
    expect(validateFullName('   ').valid).toBe(false);
  });

  it('rejects single character', () => {
    expect(validateFullName('A').valid).toBe(false);
  });

  it('accepts valid full names', () => {
    expect(validateFullName('Jane Doe').valid).toBe(true);
  });

  it('accepts names at exactly 2 characters', () => {
    expect(validateFullName('Jo').valid).toBe(true);
  });

  it('rejects names over 100 characters', () => {
    expect(validateFullName('a'.repeat(101)).valid).toBe(false);
  });

  it('accepts names at exactly 100 characters', () => {
    expect(validateFullName('a'.repeat(100)).valid).toBe(true);
  });
});

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

describe('validateCategory', () => {
  it('rejects empty string', () => {
    expect(validateCategory('').valid).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    expect(validateCategory('   ').valid).toBe(false);
  });

  it('rejects single character', () => {
    expect(validateCategory('A').valid).toBe(false);
  });

  it('rejects over 50 characters', () => {
    expect(validateCategory('a'.repeat(51)).valid).toBe(false);
  });

  it('rejects special-characters-only input', () => {
    expect(validateCategory('!!!').valid).toBe(false);
  });

  it('accepts predefined category', () => {
    expect(validateCategory('Baker').valid).toBe(true);
  });

  it('accepts custom Other category', () => {
    expect(validateCategory('Tattoo Artist').valid).toBe(true);
  });

  it('accepts exactly 2 characters', () => {
    expect(validateCategory('DJ').valid).toBe(true);
  });

  it('accepts exactly 50 characters', () => {
    expect(validateCategory('DJ' + 'a'.repeat(48)).valid).toBe(true);
  });
});

describe('validateReviewPrompt', () => {
  it('accepts empty string (optional)', () => {
    expect(validateReviewPrompt('').valid).toBe(true);
  });

  it('accepts valid prompt', () => {
    expect(validateReviewPrompt('Please mention the event type.').valid).toBe(true);
  });

  it('rejects prompt over 500 characters', () => {
    expect(validateReviewPrompt('a'.repeat(501)).valid).toBe(false);
  });

  it('accepts exactly 500 characters', () => {
    expect(validateReviewPrompt('a'.repeat(500)).valid).toBe(true);
  });
});

describe('validateSocialUsername', () => {
  it('accepts empty string (optional)', () => {
    expect(validateSocialUsername('').valid).toBe(true);
  });

  it('accepts simple alphanumeric username', () => {
    expect(validateSocialUsername('chouchou_bakery').valid).toBe(true);
  });

  it('accepts usernames with dots and hyphens', () => {
    expect(validateSocialUsername('thomas-chou').valid).toBe(true);
    expect(validateSocialUsername('my.handle').valid).toBe(true);
  });

  it('rejects usernames with spaces', () => {
    expect(validateSocialUsername('user name').valid).toBe(false);
  });

  it('rejects usernames with special characters', () => {
    expect(validateSocialUsername('user@name').valid).toBe(false);
    expect(validateSocialUsername('user!name').valid).toBe(false);
    expect(validateSocialUsername('user#name').valid).toBe(false);
  });

  it('rejects usernames over 50 characters', () => {
    expect(validateSocialUsername('a'.repeat(51)).valid).toBe(false);
  });

  it('accepts exactly 50 characters', () => {
    expect(validateSocialUsername('a'.repeat(50)).valid).toBe(true);
  });

  it('accepts single character', () => {
    expect(validateSocialUsername('x').valid).toBe(true);
  });
});
