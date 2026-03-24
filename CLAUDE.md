# Glaze — The Verified Reputation Network (Backend)

<project-overview>
Backend integration for Glaze, a video-based freelancer reputation platform.
Frontend: Vite + React + TypeScript + shadcn-ui + Tailwind CSS (built via Lovable).
Backend: Supabase (auth, database, file storage).
No separate backend server. All backend logic runs through Supabase client + Row Level Security (RLS).
</project-overview>

<tech-stack>
- Frontend: Vite, React 18, TypeScript, shadcn-ui, Tailwind CSS, React Router
- Backend: Supabase (PostgreSQL, Auth, Storage)
- Supabase client: @supabase/supabase-js
- Testing: Vitest + React Testing Library (vitest.config.ts already exists in repo)
</tech-stack>

<features-to-build>
1. Auth: sign up / login with email+password. Two roles: "freelancer" and "client".
2. Freelancer onboarding: after signup, freelancer enters services they offer (stored in DB, displayed on profile Services tab).
3. Media upload: clients upload photos/videos from camera roll as reviews for a specific freelancer. Uploads go to Supabase Storage. Review metadata goes to reviews table. Media appears on freelancer's Reviews tab.
</features-to-build>

<supabase-schema>

## profiles table
- id: uuid (references auth.users.id)
- role: text ('freelancer' | 'client')
- full_name: text
- avatar_url: text (nullable)
- tagline: text (nullable, max 150 chars)
- category: text (nullable — e.g. "Baker", "Makeup Artist")
- location: text (nullable)
- is_public: boolean (default true)
- is_shy: boolean (default false)
- review_prompt: text (nullable, max 500 chars)
- social_links: jsonb (default '{}' — shape: { instagram, tiktok, linkedin, website })
- verified_instagram: boolean (default false)
- verified_linkedin: boolean (default false)
- verified_identity: boolean (default false)
- created_at: timestamptz

## freelancer_services table
- id: uuid (primary key, default gen_random_uuid())
- freelancer_id: uuid (references profiles.id)
- service_name: text (NOT NULL, min 2 chars, max 100 chars)
- created_at: timestamptz

## reviews table
- id: uuid (primary key, default gen_random_uuid())
- freelancer_id: uuid (references profiles.id)
- client_id: uuid (references profiles.id)
- rating: integer (CHECK: rating >= 1 AND rating <= 5)
- text_content: text (nullable)
- media_url: text (nullable — URL from Supabase Storage)
- media_type: text ('image' | 'video' | null)
- created_at: timestamptz

## freelancer_portfolio table (added in migration 002)
- id: uuid (primary key, default gen_random_uuid())
- freelancer_id: uuid (references profiles.id, ON DELETE CASCADE)
- image_url: text (NOT NULL — URL from Supabase Storage)
- caption: text (nullable, max 200 chars)
- display_order: integer (default 0)
- created_at: timestamptz (default now())

RLS policies:
- SELECT: public (everyone can read)
- INSERT: authenticated user whose uid = freelancer_id
- DELETE: authenticated user whose uid = freelancer_id

## Supabase Storage buckets

### review-media
- Bucket name: "review-media"
- Public read access
- Authenticated upload only
- Path pattern: {freelancer_id}/{review_id}.{ext}
- Max file size: 50MB

### portfolio-media (added in migration 002)
- Bucket name: "portfolio-media"
- Public read access
- Authenticated upload only
- Path pattern: {freelancer_id}/{filename}
- Max file size: 50MB
- Storage RLS: INSERT restricted to auth.uid()::text = (storage.foldername(name))[1]

</supabase-schema>

<project-structure>
New/modified files only — do NOT touch existing frontend files unless wiring data.
```
src/
├── lib/
│   ├── supabase.ts           # Supabase client init
│   └── validation.ts         # Shared input validation functions
├── contexts/
│   └── AuthContext.tsx        # Auth state provider (user, role, loading)
├── pages/
│   ├── Login.tsx              # Login page (email + password)
│   ├── Signup.tsx             # Signup page (email + password + role selector)
│   └── FreelancerOnboard.tsx  # Post-signup: enter services
├── components/
│   ├── ProtectedRoute.tsx     # Redirects to /login if not authenticated
│   ├── RoleRoute.tsx          # Redirects if wrong role
│   ├── ServiceForm.tsx        # Add/remove services (freelancer)
│   ├── ReviewUpload.tsx       # Upload photo/video + rating + text (client)
│   └── ReviewMediaCard.tsx    # Display uploaded review media
├── hooks/
│   ├── useAuth.ts             # Hook into AuthContext
│   ├── useServices.ts         # CRUD for freelancer_services
│   └── useReviews.ts          # CRUD for reviews + media upload
└── __tests__/
    ├── validation.test.ts     # Unit tests for validation logic
    ├── useServices.test.ts    # Service CRUD tests
    └── useReviews.test.ts     # Review CRUD tests
```
</project-structure>

<commands>
- `npm run dev` — start dev server
- `npm run build` — verify no build errors
- `npx vitest run` — run all tests once
- `npx vitest run --reporter=verbose` — run tests with detailed output
</commands>

<environment-variables>
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
</environment-variables>

<coding-rules>
- NEVER delete or rewrite existing frontend components/pages. Only ADD new files or MODIFY existing ones minimally to integrate auth/data.
- NEVER change the color scheme, fonts, or visual design. Frontend partner handles that.
- ALWAYS use Supabase client-side SDK. No Express, no serverless functions.
- ALWAYS add Row Level Security (RLS) policies to every table.
- ALWAYS run `npm run build` after completing a feature to catch errors.
- ALWAYS run `npx vitest run` after completing a feature to verify tests pass.
- Keep each new file under 150 lines. Split if larger.
- Use existing shadcn-ui components for all form UI (buttons, inputs, cards, dialogs).
- All new pages must be responsive.
- Handle loading and error states on every async operation.
- User-facing text uses "Glaze" not "Review" (e.g., "Leave a Glaze", "Glazes" tab). Database columns and code file names stay as "review/reviews".
- Freelancer profiles are NOT created in the database until onboarding is fully completed. Auth user is created at signup, profile row is created at the end of onboarding.
</coding-rules>

<validation-rules>
IMPORTANT: All user input MUST be validated before any database operation.
Create a shared validation module at src/lib/validation.ts.

## Required validations
- Email: valid email format (use regex or a lightweight validator)
- Password: minimum 8 characters
- Full name: 2-100 characters, trimmed, no empty strings
- Service name: 2-100 characters, trimmed, no empty strings, no special-characters-only input
- Review text: max 500 characters if provided
- Rating: integer between 1 and 5 inclusive
- File upload: must be image/* or video/*, max 50MB

## Validation implementation pattern
```typescript
// src/lib/validation.ts
export function validateServiceName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (trimmed.length < 2) return { valid: false, error: "Service name must be at least 2 characters" };
  if (trimmed.length > 100) return { valid: false, error: "Service name must be under 100 characters" };
  if (!/[a-zA-Z]/.test(trimmed)) return { valid: false, error: "Service name must contain letters" };
  return { valid: true };
}
```

## Validation behavior
- Show inline error messages below the input field (use shadcn-ui form patterns)
- Disable submit button while input is invalid
- Trim all text inputs before saving
- Prevent duplicate service names for the same freelancer (check client-side before insert)
</validation-rules>

<testing-rules>
Write tests for every hook and validation function. Use Vitest (already configured in repo).

## What to test
- validation.ts: every validation function with valid input, invalid input, and edge cases
- useServices.ts: add service, remove service, prevent duplicates, reject invalid input
- useReviews.ts: submit review, reject invalid rating, reject oversized files
- Auth flows: signup creates profile with correct role, login returns session

## Test pattern
```typescript
import { describe, it, expect } from 'vitest';
import { validateServiceName } from '../lib/validation';

describe('validateServiceName', () => {
  it('rejects empty strings', () => {
    expect(validateServiceName('').valid).toBe(false);
  });
  it('rejects whitespace-only strings', () => {
    expect(validateServiceName('   ').valid).toBe(false);
  });
  it('rejects strings under 2 characters', () => {
    expect(validateServiceName('A').valid).toBe(false);
  });
  it('accepts valid service names', () => {
    expect(validateServiceName('Wedding Photography').valid).toBe(true);
  });
  it('rejects special-characters-only input', () => {
    expect(validateServiceName('!!!???').valid).toBe(false);
  });
});
```

## Testing behavior
- Tests run with `npx vitest run`
- ALWAYS run tests after writing them to verify they pass
- If a test fails, fix the implementation, not the test (unless the test itself is wrong)
- Mock Supabase client for hook tests — do not hit real database in tests
</testing-rules>

<routing-rules>
IMPORTANT: Every page must have a clear back/escape path. No dead ends.

## Required navigation behavior
- Login page: link to Signup. After success → redirect based on role.
- Signup page: link to Login. After success → freelancer goes to /onboard, client goes to home.
- Freelancer onboard: "Skip" or "Continue to Profile" button always visible. Back button or logo navigates to home.
- Profile page: back button or breadcrumb to search/home. Never trap the user.
- All auth pages: if already logged in, redirect away (don't show login to logged-in users).
- After logout: redirect to home or login page.

## Route guards
- ProtectedRoute: wraps routes that require authentication. Redirects to /login if no session.
- RoleRoute: wraps routes that require a specific role. Redirects to home if wrong role.
- /onboard route: only accessible to freelancers. Clients get redirected to home.
</routing-rules>

<error-handling>
- Every Supabase call must be wrapped in try/catch or check the .error property
- Display user-friendly error messages using shadcn-ui Toast or inline text
- Never show raw Supabase error messages to the user
- Log errors to console for debugging
- Handle these specific cases:
  - Network failure: "Connection error. Please try again."
  - Auth failure: "Invalid email or password."
  - Duplicate email: "An account with this email already exists."
  - File too large: "File must be under 50MB."
  - Upload failure: "Upload failed. Please try again."
</error-handling>

<workflow>
After completing any feature:
1. Run `npm run build` — fix all build errors
2. Run `npx vitest run` — fix all test failures
3. Manually test the feature in the browser
4. Check browser console for errors
5. Test the unhappy paths (bad input, no network, wrong role)
6. Only then report the feature as complete

- Do NOT run `npx playwright test` or any e2e tests. We do not have a separate test database.
  E2E tests exist in the e2e/ directory but are not ready to run yet.
- Only run `npx vitest run --reporter=verbose` for unit tests.
</workflow>

<regression-testing>
CRITICAL: Before reporting any session as complete, run the FULL test suite, not just new tests.

The command is always: npx vitest run --reporter=verbose

If a test that was passing before your changes now fails:
1. Read the test to understand what it expects
2. The test defines correct behavior — do not change the test
3. Find what you changed that broke it
4. Fix your code, not the test
5. Run the full suite again

The only exception: if a test is testing behavior that was explicitly changed by the requirements in this session's prompt, update the test to match the new requirement AND note it in your summary.

After the full suite passes, list:
- Total tests: X
- Passed: X
- Failed: 0
- New tests added this session: X
</regression-testing>