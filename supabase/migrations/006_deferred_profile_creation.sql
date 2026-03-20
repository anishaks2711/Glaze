-- Migration 006: Deferred profile creation
--
-- Previously, a DB trigger auto-created a profiles row the instant an auth
-- user signed up.  This caused half-finished profiles (missing name, category,
-- services, etc.) whenever a user exited the onboarding flow early.
--
-- The new flow: the trigger is removed.  The frontend inserts the profile row
-- only after the user completes every onboarding step.
--
-- Run this in the Supabase SQL Editor.

-- 1. Drop the auto-profile trigger + function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Allow authenticated users to insert their own profile row.
--    (The trigger used security-definer to bypass RLS; now the user does it
--    directly, so an INSERT policy is required.)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
