-- Migration 007: Add username, is_shy, review_prompt columns to profiles
-- Run this in the Supabase SQL Editor

DO $$
BEGIN
  -- Username: unique handle for the freelancer (e.g. @jane.smith)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE profiles ADD COLUMN username text;
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON profiles (username);
  END IF;

  -- is_shy: when true, show donut logo instead of real photo on public profile
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_shy'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_shy boolean NOT NULL DEFAULT false;
  END IF;

  -- review_prompt: custom text shown to clients when recording a Glaze (max 500 chars)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'review_prompt'
  ) THEN
    ALTER TABLE profiles ADD COLUMN review_prompt text CHECK (char_length(review_prompt) <= 500);
  END IF;
END $$;
