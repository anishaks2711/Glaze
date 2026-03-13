const ALLOWED_CHARS = /^[a-zA-Z0-9 &'()\-,./]+$/;

export function validateServiceName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Service name cannot be empty.';
  if (trimmed.length < 3) return 'Service name must be at least 3 characters.';
  if (trimmed.length > 60) return 'Service name must be under 60 characters.';
  if (!ALLOWED_CHARS.test(trimmed)) return 'Only letters, numbers, and basic punctuation are allowed.';
  return null;
}
