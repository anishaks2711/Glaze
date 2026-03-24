// Shared category list — alphabetical, used by onboarding and edit-profile.
export const FREELANCER_CATEGORIES = [
  'Baker',
  'Event Planner',
  'Florist',
  'Hair Stylist',
  'MC',
  'Other',
] as const;

export type FreelancerCategory = (typeof FREELANCER_CATEGORIES)[number];
