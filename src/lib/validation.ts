export function validateServiceName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) return { valid: false, error: 'Service name cannot be empty.' };
  if (trimmed.length < 2) return { valid: false, error: 'Service name must be at least 2 characters.' };
  if (trimmed.length > 100) return { valid: false, error: 'Service name must be under 100 characters.' };
  if (!/[a-zA-Z]/.test(trimmed)) return { valid: false, error: 'Service name must contain at least one letter.' };
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim();
  if (!trimmed) return { valid: false, error: 'Email cannot be empty.' };
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return { valid: false, error: 'Please enter a valid email address.' };
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) return { valid: false, error: 'Password must be at least 8 characters.' };
  return { valid: true };
}
