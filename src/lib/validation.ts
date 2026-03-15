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

export function validateTagline(tagline: string): { valid: boolean; error?: string } {
  const trimmed = tagline.trim();
  if (trimmed.length > 150) return { valid: false, error: 'Tagline must be under 150 characters.' };
  return { valid: true };
}

export function validateCaption(caption: string): { valid: boolean; error?: string } {
  const trimmed = caption.trim();
  if (trimmed.length > 200) return { valid: false, error: 'Caption must be under 200 characters.' };
  return { valid: true };
}

export function validatePortfolioFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) return { valid: false, error: 'File must be an image.' };
  if (file.size > 10 * 1024 * 1024) return { valid: false, error: 'File must be under 10MB.' };
  return { valid: true };
}

export function validateReviewRating(rating: number): { valid: boolean; error?: string } {
  if (!Number.isInteger(rating)) return { valid: false, error: 'Rating must be a whole number.' };
  if (rating < 1 || rating > 5) return { valid: false, error: 'Rating must be between 1 and 5.' };
  return { valid: true };
}

export function validateReviewText(text: string): { valid: boolean; error?: string } {
  if (text.length > 500) return { valid: false, error: 'Review text must be under 500 characters.' };
  return { valid: true };
}

export function validateReviewFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return { valid: false, error: 'File must be an image or video.' };
  }
  if (file.size > 50 * 1024 * 1024) return { valid: false, error: 'File must be under 50MB.' };
  return { valid: true };
}

export function validateReviewVideo(file: File | null): { valid: boolean; error?: string } {
  if (!file) return { valid: true };
  if (!file.type.startsWith('video/')) return { valid: false, error: 'Video file must be a video.' };
  if (file.size > 100 * 1024 * 1024) return { valid: false, error: 'Video must be under 100MB.' };
  return { valid: true };
}

export function validateReviewPhoto(file: File | null): { valid: boolean; error?: string } {
  if (!file) return { valid: true };
  if (!file.type.startsWith('image/')) return { valid: false, error: 'Photo must be an image.' };
  if (file.size > 10 * 1024 * 1024) return { valid: false, error: 'Photo must be under 10MB.' };
  return { valid: true };
}

export function validateReviewCaption(caption: string): { valid: boolean; error?: string } {
  if (caption.length > 150) return { valid: false, error: 'Caption must be under 150 characters.' };
  return { valid: true };
}
