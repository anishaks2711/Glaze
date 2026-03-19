// Shared category list — alphabetical, used by onboarding and edit-profile.
export const FREELANCER_CATEGORIES = [
  'Baker',
  'DJ',
  'Emcee',
  'Event Planner',
  'Florist',
  'Hair Stylist',
  'Makeup Artist',
  'Personal Chef',
  'Photographer',
  'Videographer',
  'Other',
] as const;

export type FreelancerCategory = (typeof FREELANCER_CATEGORIES)[number];
