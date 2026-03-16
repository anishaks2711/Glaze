export function getPostSignupRedirect(role: 'freelancer' | 'client'): string {
  return role === 'freelancer' ? '/onboard' : '/';
}
