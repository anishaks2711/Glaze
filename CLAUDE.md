# Glaze — The Verified Reputation Network (Backend)

## What this is
Backend integration for Glaze, a video-based freelancer reputation platform.
Frontend: Vite + React + TypeScript + shadcn-ui + Tailwind CSS (built via Lovable).
Backend: Supabase (auth, database, file storage).

## Tech Stack
- Frontend: Vite, React 18, TypeScript, shadcn-ui, Tailwind CSS, React Router
- Backend: Supabase (PostgreSQL, Auth, Storage)
- Supabase client: @supabase/supabase-js
- No separate backend server. All backend logic runs through Supabase client + Row Level Security (RLS).

## What we're building (backend only — do NOT rewrite frontend components)
1. Auth: sign up / login with email+password. Two roles: "freelancer" and "client".
2. Freelancer onboarding: after signup, freelancer enters services they offer (stored in DB, displayed on profile Services tab).
3. Media upload: clients upload photos/videos from camera roll as reviews for a specific freelancer. Uploads go to Supabase Storage. Review metadata goes to the reviews table. Media appears on that freelancer's Reviews tab.

## Supabase Schema

### profiles table
- id: uuid (references auth.users.id)
- role: text ('freelancer' | 'client')
- full_name: text
- avatar_url: text (nullable)
- created_at: timestamptz

### freelancer_services table
- id: uuid (primary key, default gen_random_uuid())
- freelancer_id: uuid (references profiles.id)
- service_name: text
- created_at: timestamptz

### reviews table
- id: uuid (primary key, default gen_random_uuid())
- freelancer_id: uuid (references profiles.id)
- client_id: uuid (references profiles.id)
- rating: integer (1-5)
- text_content: text (nullable)
- media_url: text (nullable — URL from Supabase Storage)
- media_type: text ('image' | 'video' | null)
- created_at: timestamptz

### Supabase Storage bucket
- Bucket name: "review-media"
- Public read access
- Authenticated upload only
- Path pattern: {freelancer_id}/{review_id}.{ext}

## Project Structure (new/modified files only)
```
src/
├── lib/
│   └── supabase.ts           # Supabase client init
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
```

## Commands
- `npm run dev` — start dev server
- `npm run build` — verify no build errors
- `npx supabase start` — start local Supabase (if using local dev)
- `npx supabase db push` — push migrations

## Environment Variables
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Rules
- NEVER delete or rewrite existing frontend components/pages. Only ADD new files or MODIFY existing ones minimally to integrate auth/data.
- NEVER change the color scheme, fonts, or visual design. Frontend partner handles that.
- ALWAYS use Supabase client-side SDK. No Express, no serverless functions.
- ALWAYS add Row Level Security (RLS) policies to every table.
- ALWAYS run `npm run build` after completing a feature to catch errors.
- Keep each new file under 150 lines. Split if larger.
- Use existing shadcn-ui components for any new UI (buttons, inputs, cards, dialogs).
- All new pages must be responsive.
- Handle loading and error states on every async operation.