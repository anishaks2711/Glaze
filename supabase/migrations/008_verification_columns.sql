-- Migration 008: Add verification columns to profiles
-- Run this in the Supabase SQL Editor

DO $$
BEGIN
  -- verified_instagram: set true when freelancer verifies via Instagram (fake for prototype)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'verified_instagram'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verified_instagram boolean NOT NULL DEFAULT false;
  END IF;

  -- verified_linkedin: set true when freelancer verifies via LinkedIn (fake for prototype)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'verified_linkedin'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verified_linkedin boolean NOT NULL DEFAULT false;
  END IF;

  -- verified_identity: set true when freelancer records identity video (fake for prototype)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'verified_identity'
  ) THEN
    ALTER TABLE profiles ADD COLUMN verified_identity boolean NOT NULL DEFAULT false;
  END IF;
END $$;
